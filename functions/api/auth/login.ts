import { Env, json, sessionCookie, uid, verifyPassword } from "../_lib";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { email, password } = await request.json<{ email: string; password: string }>();
  if (!email || !password) return json({ error: "Email and password are required." }, { status: 400 });

  const user = await env.DB.prepare(
    "SELECT id, email, password_hash, name, title FROM users WHERE email = ?"
  )
    .bind(email.toLowerCase())
    .first<{ id: string; email: string; password_hash: string; name: string; title: string }>();

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return json({ error: "Invalid email or password." }, { status: 401 });
  }

  const token = uid();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(token, user.id, expires)
    .run();

  return json(
    { user: { id: user.id, email: user.email, name: user.name, title: user.title } },
    { headers: { "set-cookie": sessionCookie(token, 30 * 24 * 60 * 60) } }
  );
};
