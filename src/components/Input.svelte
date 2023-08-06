<script>
	export let id = `in-${crypto.randomUUID()}`
	export let required = false
	export let type = 'text'
	export let label = ''
	export let value
	export let placeholder = ''
	export let min = 0

	function typeAction(node) {
		node.type = type
	}
</script>

<div class="line input-outer">
	{#if label}
		<label class="input-label" for={id}>{ label }</label>
	{/if}
	{#if type == 'number'}
		<input id={id} class="input" type="number" {min} {required} {placeholder} bind:value={value}>
	{:else}
		<input id={id} class="input" use:typeAction {required} {placeholder} bind:value={value}>
	{/if}
	<slot />
</div>