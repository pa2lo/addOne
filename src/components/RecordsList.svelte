<script>
	import { createEventDispatcher } from 'svelte';
	import { slide } from 'svelte/transition';
	import Icon from './Icon.svelte';

	export let expanded = false
	export let title
	export let times
	export let isToday = false
	export let isYesterday = false

	let isExpanded = expanded

	const dispatch = createEventDispatcher();
	function deleteRecord(time) {
		dispatch('deleteRecord', {
			string: time.string,
			timestamp: time.timestamp
		})
	}
</script>

<div class="records-cont line" class:expanded={isExpanded}>
	<div class="records-date" on:click={() => isExpanded = !isExpanded} on:keypress={() => false} tabindex="-1" role="button">
		<div class="records-date-title">
			{#if isToday}
				Today
			{:else if isYesterday}
				Yesterday
			{:else}
				{ title }
			{/if}
		</div>
		<div class="records-date-count">{ times.length }</div>
		<Icon name="down" />
	</div>
	{#if isExpanded}
		<div transition:slide={{duration: 250}} class="records-times">
			{#each times as time}
				<div class="records-time">
					<span class="records-time-time">{ time.string }</span>
					{#if time.warning}
						<span class="records-time-warning"><Icon name="shield" /></span>
					{/if}
					<button on:click|preventDefault={() => deleteRecord(time)} class="countersList-icoButton records-time-remove" title="Delete record"><Icon name="trash" /></button>
				</div>
			{/each}
		</div>
	{/if}
</div>