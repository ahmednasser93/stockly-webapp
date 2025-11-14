export const onRequest: PagesFunction = async ({ request, env }) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { username, password } = await request.json().catch(() => ({}));

  if (typeof username !== "string" || typeof password !== "string") {
    return new Response("Bad Request", { status: 400 });
  }

  const expectedUsername =
    env.STOCKLY_USERNAME ??
    env.VITE_STOCKLY_USERNAME ??
    "";
  const expectedPassword =
    env.STOCKLY_PASS ??
    env.VITE_STOCKLY_PASS ??
    "";

  const isValid =
    Boolean(expectedUsername) &&
    Boolean(expectedPassword) &&
    username === expectedUsername &&
    password === expectedPassword;

  return new Response(null, { status: isValid ? 204 : 401 });
};
