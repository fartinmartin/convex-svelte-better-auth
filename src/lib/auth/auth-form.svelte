<script lang="ts">
	let {
		signIn,
		signUp,
	}: {
		signIn: (input: { email: string; password: string }) => Promise<void>;
		signUp: (input: {
			name: string;
			email: string;
			password: string;
		}) => Promise<void>;
	} = $props();

	let mode = $state<"sign-in" | "sign-up">("sign-in");
	let name = $state("");
	let email = $state("");
	let password = $state("");

	function toggle() {
		mode = mode === "sign-in" ? "sign-up" : "sign-in";
		name = email = password = "";
	}

	async function onsubmit(event: Event, cb: () => Promise<void>) {
		event.preventDefault();
		await cb();
	}
</script>

<h2>{mode}</h2>

{#if mode === "sign-in"}
	<form onsubmit={(e) => onsubmit(e, () => signIn({ email, password }))}>
		<input type="email" placeholder="email" bind:value={email} required />
		<input
			type="password"
			placeholder="password"
			bind:value={password}
			required
		/>
		<button type="submit">sign in</button>
	</form>
	<p>don't have an account?</p>
{:else}
	<form onsubmit={(e) => onsubmit(e, () => signUp({ name, email, password }))}>
		<input bind:value={name} placeholder="name" required />
		<input type="email" placeholder="email" bind:value={email} required />
		<input
			type="password"
			placeholder="password"
			bind:value={password}
			required
		/>
		<button type="submit">sign in</button>
		<p>already have an account?</p>
	</form>
{/if}

<button type="button" onclick={toggle}
	>{mode === "sign-in" ? "sign up" : "sign in"}</button
>
