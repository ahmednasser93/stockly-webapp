// @ts-expect-error - Cloudflare Pages types may not be available
type PagesFunction = (context: {
  request: Request;
  next: () => Promise<Response>;
  env: Record<string, unknown>;
  waitUntil: (promise: Promise<unknown>) => void;
}) => Promise<Response>;

export const onRequest: PagesFunction = async (context) => {
    const { request, next } = context;

    // Handle preflight requests
    if (request.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
                "Access-Control-Max-Age": "86400",
            },
        });
    }

    // Handle normal requests
    const response = await next();
    const newResponse = new Response(response.body, response);
    newResponse.headers.set("Access-Control-Allow-Origin", "*");
    return newResponse;
};
