import { Env, json, requireUser } from "../_lib";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireUser(request, env);
  if (!user) return json({ error: "Not authenticated." }, { status: 401 });

  const existing = await env.DB.prepare("SELECT squad_id FROM squad_members WHERE user_id = ?").bind(user.id).first();
  if (existing) return json({ error: "You're already in a squad." }, { status: 409 });

  const { invite_code } = await request.json<{ invite_code: string }>();
  if (!invite_code) return json({ error: "Invite code is required." }, { status: 400 });

  const squad = await env.DB.prepare("SELECT id, name FROM squads WHERE invite_code = ?")
    .bind(invite_code.toUpperCase())
    .first<{ id: string; name: string }>();
  if (!squad) return json({ error: "No squad found with that invite code." }, { status: 404 });

  await env.DB.prepare("INSERT INTO squad_members (squad_id, user_id) VALUES (?, ?)").bind(squad.id, user.id).run();

  return json({ squad });
};
