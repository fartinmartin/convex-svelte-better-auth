import { createAuthClient } from "better-auth/svelte";
import {
  anonymousClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import type { authWithoutCtx } from "$lib/auth";

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof authWithoutCtx>(),
    anonymousClient(),
    convexClient<typeof authWithoutCtx>(),
  ],
});
