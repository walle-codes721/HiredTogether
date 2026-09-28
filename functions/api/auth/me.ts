import { Env, json, requireUser } from "../_lib";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireUser(request, env);
  if (!user) return json({ error: "Not authenticated." }, { status: 401 });
  return json({ user });
};
