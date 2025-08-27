import type { ConvexClientOptions } from "convex/browser";
import type { BetterAuthClientPlugin, ClientOptions } from "better-auth";
import type { createAuthClient } from "better-auth/svelte";
import type {
  crossDomainClient,
  convexClient,
} from "@convex-dev/better-auth/client/plugins";

export type ConvexAuthClient = {
  verbose?: boolean;
  logger?: Exclude<NonNullable<ConvexClientOptions["logger"]>, boolean>;
};

type CrossDomainClient = ReturnType<typeof crossDomainClient>;
type ConvexClientBetterAuth = ReturnType<typeof convexClient>;

type PluginsWithCrossDomain = (
  | CrossDomainClient
  | ConvexClientBetterAuth
  | BetterAuthClientPlugin
)[];

type PluginsWithoutCrossDomain = (
  | ConvexClientBetterAuth
  | BetterAuthClientPlugin
)[];

type AuthClientWithPlugins<
  Plugins extends PluginsWithCrossDomain | PluginsWithoutCrossDomain,
> = ReturnType<
  typeof createAuthClient<
    ClientOptions & {
      plugins: Plugins;
    }
  >
>;

export type AuthClient =
  | AuthClientWithPlugins<PluginsWithCrossDomain>
  | AuthClientWithPlugins<PluginsWithoutCrossDomain>;

type ExtractSessionState<T> = T extends {
  subscribe(fn: (state: infer S) => void): unknown;
}
  ? S
  : never;

export type SessionState = ExtractSessionState<
  ReturnType<AuthClient["useSession"]>
>;
