<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import { setupConvex, useConvexClient } from "convex-svelte";
	import { PUBLIC_CONVEX_API_URL } from "$env/static/public";
	import { authClient } from "$lib/auth-client";
	import { createAuthClient } from "$lib/auth/client.svelte";

	let { children } = $props();

	setupConvex(PUBLIC_CONVEX_API_URL);
	const convexClient = useConvexClient();
	createAuthClient({ authClient, convexClient, options: { verbose: true } });
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
