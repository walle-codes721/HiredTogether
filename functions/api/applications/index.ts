import { Env, json, requireUser, uid } from "../_lib";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireUser(request, env);
  if (!user) return json({ error: "Not authenticated." }, { status: 401 });

  const { results } = await env.DB.prepare(
    "SELECT * FROM applications WHERE user_id = ? ORDER BY created_at DESC"
  )
    .bind(user.id)
    .all();

  return json({ applications: results });
};

const STATUSES = new Set(["applied", "interview", "offer", "rejected"]);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireUser(request, env);
  if (!user) return json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json<{
    company: string;
    role: string;
    status?: string;
    salary?: string;
    notes?: string;
    next_step?: string;
    next_step_at?: string;
  }>();

  if (!body.company || !body.role) {
    return json({ error: "Company and role are required." }, { status: 400 });
  }
  const status = STATUSES.has(body.status ?? "") ? body.status! : "applied";

  const id = uid();
  await env.DB.prepare(
    `INSERT INTO applications (id, user_id, company, role, status, salary, notes, next_step, next_step_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, user.id, body.company, body.role, status, body.salary ?? "", body.notes ?? "", body.next_step ?? "", body.next_step_at ?? "")
    .run();

  const created = await env.DB.prepare("SELECT * FROM applications WHERE id = ?").bind(id).first();
  return json({ application: created }, { status: 201 });
};
