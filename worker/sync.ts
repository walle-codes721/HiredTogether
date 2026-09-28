interface Env {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}

interface Connection {
  user_id: string;
  refresh_token: string;
}

const STATUS_RULES: { status: string; patterns: RegExp[] }[] = [
  { status: "offer", patterns: [/pleased to offer/i, /formal offer/i, /offer letter/i, /excited to extend.*offer/i, /congratulations.*offer/i] },
  {
    status: "interview",
    patterns: [
      /invite you to interview/i,
      /schedule (a|your) (call|interview)/i,
      /phone screen/i,
      /next steps? in (the|our) (hiring|interview) process/i,
      /move forward with (your|the) (application|candidacy)/i,
    ],
  },
  {
    status: "rejected",
    patterns: [
      /moving forward with other candidates/i,
      /decided not to (proceed|move forward)/i,
      /will not be moving forward/i,
      /position has been filled/i,
      /pursue other candidates/i,
      /unfortunately.{0,40}(not|unable)/i,
    ],
  },
];

const SEARCH_QUERY =
  '(interview OR "phone screen" OR offer OR "moving forward" OR "not moving forward" OR unfortunately OR "other candidates" OR "position has been filled" OR congratulations) newer_than:3d';

function classify(text: string): string | null {
  for (const rule of STATUS_RULES) {
    if (rule.patterns.some((p) => p.test(text))) return rule.status;
  }
  return null;
}

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function refreshAccessToken(env: Env, refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`refresh failed: ${await res.text()}`);
  const data: { access_token: string } = await res.json();
  return data.access_token;
}

async function syncUser(env: Env, conn: Connection) {
  const accessToken = await refreshAccessToken(env, conn.refresh_token);

  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(SEARCH_QUERY)}&maxResults=20`,
    { headers: { authorization: `Bearer ${accessToken}` } }
  );
  if (!listRes.ok) return;
  const { messages }: { messages?: { id: string }[] } = await listRes.json();
  if (!messages?.length) {
    await env.DB.prepare("UPDATE gmail_connections SET last_synced_at = datetime('now') WHERE user_id = ?").bind(conn.user_id).run();
    return;
  }

  const { results: applications } = await env.DB.prepare("SELECT id, company FROM applications WHERE user_id = ?")
    .bind(conn.user_id)
    .all<{ id: string; company: string }>();

  for (const { id: messageId } of messages) {
    const already = await env.DB.prepare("SELECT 1 FROM processed_gmail_messages WHERE message_id = ?").bind(messageId).first();
    if (already) continue;
    await env.DB.prepare("INSERT INTO processed_gmail_messages (message_id, user_id) VALUES (?, ?)").bind(messageId, conn.user_id).run();

    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
      { headers: { authorization: `Bearer ${accessToken}` } }
    );
    if (!msgRes.ok) continue;
    const msg: { snippet?: string; payload?: { headers?: { name: string; value: string }[] } } = await msgRes.json();

    const subject = msg.payload?.headers?.find((h) => h.name === "Subject")?.value ?? "";
    const from = msg.payload?.headers?.find((h) => h.name === "From")?.value ?? "";
    const snippet = msg.snippet ?? "";
    const text = `${subject} ${snippet}`;

    const status = classify(text);
    if (!status) continue;

    const haystack = normalize(`${subject} ${from} ${snippet}`);
    const matches = applications.filter((a) => a.company.length > 2 && haystack.includes(normalize(a.company)));
    if (matches.length !== 1) continue;

    await env.DB.prepare("UPDATE applications SET status = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(status, matches[0].id)
      .run();
  }

  await env.DB.prepare("UPDATE gmail_connections SET last_synced_at = datetime('now') WHERE user_id = ?").bind(conn.user_id).run();
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const { results } = await env.DB.prepare("SELECT user_id, refresh_token FROM gmail_connections").all<Connection>();
    for (const conn of results) {
      ctx.waitUntil(syncUser(env, conn).catch(() => undefined));
    }
  },
};
