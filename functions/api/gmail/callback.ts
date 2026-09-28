import { Env } from "../_lib";
import { exchangeCode, fetchGoogleProfile, GoogleEnv } from "./_google";

export const onRequestGet: PagesFunction<Env & GoogleEnv> = async ({ request, env }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (errorParam) return Response.redirect(`${url.origin}/?gmail=denied`, 302);
  if (!code || !state) return new Response("Missing code or state.", { status: 400 });

  const stateRow = await env.DB.prepare(
    "SELECT user_id FROM oauth_states WHERE state = ? AND created_at > datetime('now', '-10 minutes')"
  )
    .bind(state)
    .first<{ user_id: string }>();
  await env.DB.prepare("DELETE FROM oauth_states WHERE state = ?").bind(state).run();

  if (!stateRow) return new Response("Invalid or expired state.", { status: 400 });

  try {
    const tokens = await exchangeCode(env, code);
    if (!tokens.refresh_token) {
      return Response.redirect(`${url.origin}/?gmail=no_refresh_token`, 302);
    }
    const profile = await fetchGoogleProfile(tokens.access_token);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    await env.DB.prepare(
      `INSERT INTO gmail_connections (user_id, email, refresh_token, access_token, access_token_expires_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         email = excluded.email,
         refresh_token = excluded.refresh_token,
         access_token = excluded.access_token,
         access_token_expires_at = excluded.access_token_expires_at`
    )
      .bind(stateRow.user_id, profile.email, tokens.refresh_token, tokens.access_token, expiresAt)
      .run();

    return Response.redirect(`${url.origin}/?gmail=connected`, 302);
  } catch {
    return Response.redirect(`${url.origin}/?gmail=error`, 302);
  }
};
