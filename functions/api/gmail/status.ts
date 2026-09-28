import { Env, json, requireUser } from "../_lib";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireUser(request, env);
  if (!user) return json({ error: "Not authenticated." }, { status: 401 });

  const connection = await env.DB.prepare(
    "SELECT email, connected_at, last_synced_at FROM gmail_connections WHERE user_id = ?"
  )
    .bind(user.id)
    .first<{ email: string; connected_at: string; last_synced_at: string | null }>();

  return json({ connected: !!connection, connection: connection ?? null });
};
