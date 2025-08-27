import { convexAdapter } from "@convex-dev/better-auth";
import { convex, JWT_COOKIE_NAME } from "@convex-dev/better-auth/plugins";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { anonymous } from "better-auth/plugins";
import { generateUsername } from "unique-username-generator";

import { betterAuthComponent } from "$convex/auth";
import { type GenericCtx } from "$convex/_generated/server";

const createOptions = (ctx: GenericCtx) =>
  ({
    baseURL: process.env.SITE_URL,
    database: convexAdapter(ctx, betterAuthComponent),

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },

    user: {
      deleteUser: {
        enabled: true,
      },
    },

    plugins: [
      anonymous({
        onLinkAccount: async (ctx) => {}, // todo
        generateName: async (ctx) => generateUsername(" "),
      }),
    ],
  }) satisfies BetterAuthOptions;

export const createAuth = (ctx: GenericCtx) => {
  const options = createOptions(ctx);
  return betterAuth({
    ...options,
    // pass convex plugin options so plugin schema inference flows through.
    plugins: [...options.plugins, convex({ options })],
  });
};

// mostly for inferring types from better auth options
export const authWithoutCtx = createAuth({} as any);

// svelte helpers
import type { RequestEvent } from "@sveltejs/kit";
import { createCookieGetter, parseSetCookieHeader } from "better-auth/cookies";

export function getCookie() {
  const createCookie = createCookieGetter(authWithoutCtx.options);
  return createCookie(JWT_COOKIE_NAME);
}

export function getToken(event: RequestEvent) {
  const cookie = getCookie();
  return event.cookies.get(cookie.name);
}

export async function signInAnonymous(
  event: RequestEvent,
): Promise<string | undefined> {
  const response = await event.fetch(`/api/auth/sign-in/anonymous`, {
    method: "POST",
  });

  // i think ideally we'd use the `sveltekitCookies` plugin to handle cookies, but convex complains about importing `getRequestEvent` from `$app/server`
  // https://www.better-auth.com/docs/integrations/svelte-kit#server-action-cookies
  // https://github.com/better-auth/better-auth/blob/canary/packages/better-auth/src/integrations/svelte-kit.ts

  const setCookies = response.headers?.get("set-cookie");
  let newToken: string | undefined;

  if (setCookies) {
    const parsed = parseSetCookieHeader(setCookies);

    for (const [name, { value, ...ops }] of parsed) {
      try {
        event.cookies.set(name, decodeURIComponent(value), {
          sameSite: ops.samesite,
          path: ops.path || "/",
          expires: ops.expires,
          secure: ops.secure,
          httpOnly: ops.httponly,
          domain: ops.domain,
          maxAge: ops["max-age"],
        });
      } catch (e) {
        // this will avoid any issue related to already streamed response
      }

      if (name === getCookie().name) newToken = value;
    }
  }

  return newToken;
}
