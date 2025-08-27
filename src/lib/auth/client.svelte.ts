// https://github.com/mmailaender/convex-better-auth-svelte/blob/main/src/lib/svelte/client.svelte.ts

import { getContext, setContext, onMount } from "svelte";
import type { ConvexClient, ConvexClientOptions } from "convex/browser";
import type { AuthClient, SessionState } from "./client.types";

const AUTH_CONTEXT_KEY = Symbol("auth-context");

type AuthContext = {
  authClient: AuthClient;
  fetchAccessToken: (options: {
    forceRefreshToken: boolean;
  }) => Promise<string | null>;
  isLoading: boolean;
  isAuthenticated: boolean;
};

/**
 * create a convex better auth client for svelte
 */
export function createAuthClient({
  authClient,
  convexClient,
  options,
}: {
  authClient: AuthClient;
  convexClient: ConvexClient;
  options?: ConvexClientOptions;
}) {
  let sessionData: SessionState["data"] | null = $state(null);
  let sessionPending: boolean = $state(true);

  let isConvexAuthenticated: boolean | null = $state(null);

  authClient.useSession().subscribe((session) => {
    const wasAuthenticated = sessionData !== null;
    sessionData = session.data;
    sessionPending = session.isPending;

    // if session state changed from authenticated to unauthenticated, reset convex auth
    const isNowAuthenticated = sessionData !== null;
    if (wasAuthenticated && !isNowAuthenticated) {
      isConvexAuthenticated = false;
    }
    // if we went back to loading state, reset convex auth to null
    if (session.isPending && isConvexAuthenticated !== null) {
      isConvexAuthenticated = null;
    }
  });

  const isAuthProviderAuthenticated = $derived(sessionData !== null);

  const isAuthenticated = $derived(
    isAuthProviderAuthenticated && (isConvexAuthenticated ?? false),
  );

  // loading state - we're loading if session is pending or if we have a session but no convex confirmation yet
  const isLoading = $derived(
    sessionPending ||
      (isAuthProviderAuthenticated && isConvexAuthenticated === null),
  );

  const fetchAccessToken = async ({
    forceRefreshToken,
  }: {
    forceRefreshToken: boolean;
  }): Promise<string | null> => {
    if (forceRefreshToken) {
      const token = await fetchToken(authClient, logVerbose);
      logVerbose(`returning retrieved token`);
      return token;
    }
    return null;
  };

  if (!convexClient) throw new Error("No ConvexClient provided.");

  const logVerbose = (msg: string) => {
    if (options?.verbose) console.debug(`${new Date().toISOString()} ${msg}`);
  };

  // todo: this needs to be eventually an reactive effect if someone adds an ott to the url programatically.
  // call the one-time token handler
  onMount(() => handleOneTimeToken(authClient));

  // updated effect to handle backend confirmation
  $effect(() => {
    let effectRelevant = true;

    if (isAuthProviderAuthenticated) {
      // set auth with callback to receive backend confirmation
      convexClient.setAuth(fetchAccessToken, (isAuthenticated: boolean) => {
        if (effectRelevant) isConvexAuthenticated = isAuthenticated;
      });

      // cleanup function
      return () => {
        effectRelevant = false;
        // if unmounting or something changed before we finished fetching the token
        // we shouldn't transition to a loaded state.
        isConvexAuthenticated = isConvexAuthenticated ? false : null;
      };
    } else {
      // clear auth when not authenticated
      convexClient.client.clearAuth();
      // also run cleanup for clearing
      return () => {
        // set state back to loading in case this is a transition from one
        // fetchtoken function to another
        isConvexAuthenticated = null;
      };
    }
  });

  // set context to make auth state available to useauth
  setContext<AuthContext>(AUTH_CONTEXT_KEY, {
    authClient,
    fetchAccessToken,
    get isLoading() {
      return isLoading;
    },
    get isAuthenticated() {
      return isAuthenticated;
    },
  });
}

async function fetchToken(
  authClient: AuthClient,
  logVerbose: (message: string) => void,
): Promise<string | null> {
  const initialBackoff = 100;
  const maxBackoff = 1000;
  let retries = 0;

  const nextBackoff = () => {
    const baseBackoff = initialBackoff * Math.pow(2, retries);
    retries += 1;
    const actualBackoff = Math.min(baseBackoff, maxBackoff);
    const jitter = actualBackoff * (Math.random() - 0.5);
    return actualBackoff + jitter;
  };

  const fetchWithRetry = async (): Promise<string | null> => {
    try {
      const { data } = await authClient.convex.token();
      return data?.token || null;
    } catch (e) {
      if (!isNetworkError(e)) throw e;

      if (retries > 10) {
        logVerbose(`fetchToken failed with network error, giving up`);
        throw e;
      }

      const backoff = nextBackoff();
      logVerbose(
        `fetchToken failed with network error, attempting retrying in ${backoff}ms`,
      );

      await new Promise((resolve) => setTimeout(resolve, backoff));
      return fetchWithRetry();
    }
  };

  return fetchWithRetry();
}

// Handle one-time token verification (equivalent to useEffect)
async function handleOneTimeToken(authClient: AuthClient) {
  const url = new URL(window.location?.href);
  const token = url.searchParams.get("ott");

  if (!token) return;
  if (!("crossDomain" in authClient)) return;

  url.searchParams.delete("ott");
  const result = await authClient.crossDomain.oneTimeToken.verify({ token });
  const sessionData = result.data?.session;

  if (sessionData) {
    await authClient.getSession({
      fetchOptions: {
        headers: { Authorization: `Bearer ${sessionData.token}` },
      },
    });

    authClient.updateSession();
  }

  window.history.replaceState({}, "", url);
}

/**
 * Hook to access authentication state and functions
 * Must be used within a component that has createAuthClient called in its parent tree
 */
export function useAuth(): {
  isLoading: boolean;
  isAuthenticated: boolean;
  fetchAccessToken: ({
    forceRefreshToken,
  }: {
    forceRefreshToken: boolean;
  }) => Promise<string | null>;
} {
  const authContext = getContext<AuthContext>(AUTH_CONTEXT_KEY);

  if (!authContext) {
    throw new Error(
      "useAuth must be used within a component that has createAuthClient called in its parent tree",
    );
  }

  return {
    get isLoading() {
      return authContext.isLoading;
    },
    get isAuthenticated() {
      return authContext.isAuthenticated;
    },
    fetchAccessToken: authContext.fetchAccessToken,
  };
}

// https://github.com/sindresorhus/is-network-error/blob/main/index.js
function isNetworkError(error: unknown): error is TypeError {
  const objectToString = Object.prototype.toString;

  const isError = (value: unknown): value is TypeError =>
    objectToString.call(value) === "[object Error]";

  const errorMessages = new Set([
    "network error", // chrome
    "Failed to fetch", // chrome
    "NetworkError when attempting to fetch resource.", // firefox
    "The Internet connection appears to be offline.", // safari 16
    "Load failed", // safari 17+
    "Network request failed", // `cross-fetch`
    "fetch failed", // undici (node.js)
    "terminated", // undici (node.js)
  ]);

  const isValid =
    error &&
    isError(error) &&
    error.name === "TypeError" &&
    typeof error.message === "string";

  if (!isValid) {
    return false;
  }

  // we do an extra check for safari 17+ as it has a very generic error message.
  // network errors in safari have no stack.
  if (error.message === "Load failed") {
    return error.stack === undefined;
  }

  return errorMessages.has(error.message);
}
