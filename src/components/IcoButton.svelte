<script>
	import { createEventDispatcher } from 'svelte';
	import Icon from "./Icon.svelte";

	export let title = null
	export let icon = ''
	export let text = ''
	export let active = false

	const dispatch = createEventDispatcher();
	function onClick(e) {
		dispatch('click', e)
	}
</script>

<button class="icoButton" class:active={active} title={title} on:click|preventDefault={onClick}>
	{#if icon}
		<Icon name={icon} />
	{/if}
	{#if text}
		<span class="icoButton-text">{ text }</span>
	{/if}
</button>