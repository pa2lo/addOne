<script>
	import { createEventDispatcher } from 'svelte';
	import Icon from "./Icon.svelte";

	export let icon = ''
	export let full = false
	export let bigger = false
	export let wider = false
	export let buttonClass = ''
	export let disabled = false
	export let submit = false

	const dispatch = createEventDispatcher();
	function onClick(e) {
		if (!submit) e.preventDefault()
		dispatch('click', e)
	}
</script>

<button class="button {buttonClass ? `button-${buttonClass}` : ''}" class:full={full} class:bigger={bigger} class:wider={wider} type={submit ? 'submit' : 'button'} {disabled} on:click={onClick}>
	{#if icon}
		<Icon name={icon} />
	{/if}
	<span><slot /></span>
</button>