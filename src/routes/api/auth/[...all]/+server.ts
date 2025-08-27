// https://github.com/mmailaender/convex-better-auth-svelte/blob/main/src/lib/sveltekit/index.ts

import { PUBLIC_CONVEX_SITE_URL } from "$env/static/public";
import type { RequestHandler } from "@sveltejs/kit";

function createAuthHandlers() {
  const handler = (request: Request) => {
    const requestUrl = new URL(request.url);

    if (!PUBLIC_CONVEX_SITE_URL) {
      throw new Error("PUBLIC_CONVEX_SITE_URL environment variable is not set");
    }

    const nextUrl = `${PUBLIC_CONVEX_SITE_URL}${requestUrl.pathname}${requestUrl.search}`;
    const newRequest = new Request(nextUrl, request);
    newRequest.headers.set("accept-encoding", "application/json");

    return fetch(newRequest, { method: request.method, redirect: "manual" });
  };

  const requestHandler: RequestHandler = async ({ request }) => {
    return handler(request);
  };

  return {
    GET: requestHandler,
    POST: requestHandler,
  };
}

export const { GET, POST } = createAuthHandlers();
