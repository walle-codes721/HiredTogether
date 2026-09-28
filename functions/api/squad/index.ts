import { Env, json, requireUser } from "../_lib";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireUser(request, env);
  if (!user) return json({ error: "Not authenticated." }, { status: 401 });

  const membership = await env.DB.prepare(
    `SELECT s.id, s.name, s.invite_code FROM squad_members sm
     JOIN squads s ON s.id = sm.squad_id
     WHERE sm.user_id = ?`
  )
    .bind(user.id)
    .first<{ id: string; name: string; invite_code: string }>();

  if (!membership) return json({ squad: null });

  const { results: members } = await env.DB.prepare(
    `SELECT u.id, u.name, u.title,
       SUM(CASE WHEN a.status = 'offer' THEN 1 ELSE 0 END) AS offers,
       SUM(CASE WHEN a.status = 'interview' THEN 1 ELSE 0 END) AS interviews,
       SUM(CASE WHEN a.status = 'applied' THEN 1 ELSE 0 END) AS applied,
       SUM(CASE WHEN a.status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
       COUNT(a.id) AS total
     FROM squad_members sm
     JOIN users u ON u.id = sm.user_id
     LEFT JOIN applications a ON a.user_id = u.id
     WHERE sm.squad_id = ?
     GROUP BY u.id
     ORDER BY offers DESC, interviews DESC`
  )
    .bind(membership.id)
    .all();

  return json({ squad: membership, members });
};
