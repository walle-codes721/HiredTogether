import { Env, json, requireUser } from "../_lib";

const STATUSES = new Set(["applied", "interview", "offer", "rejected"]);
const EDITABLE_FIELDS = ["company", "role", "status", "salary", "notes", "next_step", "next_step_at"] as const;

export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const user = await requireUser(request, env);
  if (!user) return json({ error: "Not authenticated." }, { status: 401 });

  const existing = await env.DB.prepare("SELECT id FROM applications WHERE id = ? AND user_id = ?")
    .bind(params.id, user.id)
    .first();
  if (!existing) return json({ error: "Not found." }, { status: 404 });

  const body = await request.json<Record<string, string>>();
  if (body.status && !STATUSES.has(body.status)) {
    return json({ error: "Invalid status." }, { status: 400 });
  }

  const sets: string[] = [];
  const values: string[] = [];
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) {
      sets.push(`${field} = ?`);
      values.push(body[field]);
    }
  }
  if (sets.length === 0) return json({ error: "No fields to update." }, { status: 400 });
  sets.push("updated_at = datetime('now')");

  await env.DB.prepare(`UPDATE applications SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...values, params.id)
    .run();

  const updated = await env.DB.prepare("SELECT * FROM applications WHERE id = ?").bind(params.id).first();
  return json({ application: updated });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const user = await requireUser(request, env);
  if (!user) return json({ error: "Not authenticated." }, { status: 401 });

  await env.DB.prepare("DELETE FROM applications WHERE id = ? AND user_id = ?").bind(params.id, user.id).run();
  return json({ ok: true });
};
