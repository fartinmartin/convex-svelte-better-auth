<script lang="ts">
	import { page } from "$app/state";
	const user = page.data.user;
</script>

<pre>hello, {user?.name}!</pre>
<pre>page.data.user: {JSON.stringify(user, null, 2)}</pre>
