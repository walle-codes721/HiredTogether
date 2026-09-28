import { Env, requireUser, uid } from "../_lib";
import { buildAuthUrl, GoogleEnv } from "./_google";

export const onRequestGet: PagesFunction<Env & GoogleEnv> = async ({ request, env }) => {
  const user = await requireUser(request, env);
  if (!user) return new Response("Not authenticated.", { status: 401 });

  const state = uid();
  await env.DB.prepare("INSERT INTO oauth_states (state, user_id) VALUES (?, ?)").bind(state, user.id).run();

  return Response.redirect(buildAuthUrl(env, state), 302);
};
