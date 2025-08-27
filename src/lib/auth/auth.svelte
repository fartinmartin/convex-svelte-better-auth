<script lang="ts">
	import { page } from "$app/state";
	import { authClient } from "$lib/auth-client";
	import { useAuth } from "$lib/auth/client.svelte";
	import AuthForm from "./auth-form.svelte";

	const auth = useAuth();
	const user = page.data.user;

	async function signOut() {
		try {
			await authClient.signOut();
		} catch (error) {
			console.error("sign out error:", error);
		}
	}
</script>

{#if auth.isLoading}
	<div>loading...</div>
{:else if !auth.isAuthenticated}
	<AuthForm
		signIn={async ({ email, password }) => {
			await authClient.signIn.email(
				{ email, password },
				{ onError: (ctx) => alert(ctx.error.message) },
			);
		}}
		signUp={async ({ name, email, password }) => {
			await authClient.signUp.email(
				{ name, email, password },
				{ onError: (ctx) => alert(ctx.error.message) },
			);
		}}
	/>
{:else if auth.isAuthenticated}
	<div>
		<div>hello, {user?.name}!</div>
		<button onclick={signOut}>sign out</button>
	</div>
{/if}
