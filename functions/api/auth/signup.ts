import { Env, hashPassword, json, sessionCookie, uid } from "../_lib";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { email, password, name, title } = await request.json<{
    email: string;
    password: string;
    name: string;
    title?: string;
  }>();

  if (!email || !password || !name) {
    return json({ error: "Email, password, and name are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email.toLowerCase()).first();
  if (existing) {
    return json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const id = uid();
  const passwordHash = await hashPassword(password);
  await env.DB.prepare("INSERT INTO users (id, email, password_hash, name, title) VALUES (?, ?, ?, ?, ?)")
    .bind(id, email.toLowerCase(), passwordHash, name, title ?? "")
    .run();

  const token = uid();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").bind(token, id, expires).run();

  return json(
    { user: { id, email: email.toLowerCase(), name, title: title ?? "" } },
    { headers: { "set-cookie": sessionCookie(token, 30 * 24 * 60 * 60) } }
  );
};
