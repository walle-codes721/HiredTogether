import { clearSessionCookie, Env, json } from "../_lib";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)session=([^;]+)/);
  if (match) {
    await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(match[1]).run();
  }
  return json({ ok: true }, { headers: { "set-cookie": clearSessionCookie } });
};
