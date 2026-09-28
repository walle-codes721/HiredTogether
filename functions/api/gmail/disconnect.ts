import { Env, json, requireUser } from "../_lib";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireUser(request, env);
  if (!user) return json({ error: "Not authenticated." }, { status: 401 });

  await env.DB.prepare("DELETE FROM gmail_connections WHERE user_id = ?").bind(user.id).run();
  return json({ ok: true });
};
