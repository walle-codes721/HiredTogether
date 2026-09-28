import { Env, inviteCode, json, requireUser, uid } from "../_lib";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireUser(request, env);
  if (!user) return json({ error: "Not authenticated." }, { status: 401 });

  const existing = await env.DB.prepare("SELECT squad_id FROM squad_members WHERE user_id = ?").bind(user.id).first();
  if (existing) return json({ error: "You're already in a squad." }, { status: 409 });

  const { name } = await request.json<{ name: string }>();
  if (!name) return json({ error: "Squad name is required." }, { status: 400 });

  const id = uid();
  let code = inviteCode();
  for (let i = 0; i < 5; i++) {
    const taken = await env.DB.prepare("SELECT 1 FROM squads WHERE invite_code = ?").bind(code).first();
    if (!taken) break;
    code = inviteCode();
  }

  await env.DB.prepare("INSERT INTO squads (id, name, invite_code) VALUES (?, ?, ?)").bind(id, name, code).run();
  await env.DB.prepare("INSERT INTO squad_members (squad_id, user_id) VALUES (?, ?)").bind(id, user.id).run();

  return json({ squad: { id, name, invite_code: code } }, { status: 201 });
};
