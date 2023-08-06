<script>
	import { fade } from 'svelte/transition';
	import { createEventDispatcher, onMount } from 'svelte';

	import Icon from './Icon.svelte';

	export let header = ''
	export let closeable = false
	export let modalClass = ''
	export let modalIcon = ''
	export let forceShow = false

	let modalClosed = true
	let show = false
	let modalEl = null

	const dispatch = createEventDispatcher();

	export function openModal() {
		show = true
	}

	export function closeModal() {
		modalClosed = true
		requestAnimationFrame(() => {
			show = false
		})
	}

	function focus() {
		modalEl.querySelector('.autofocus') ? modalEl.querySelector('.autofocus').focus() : modalEl.focus()
	}

	function handleBackdropClick() {
		if (!closeable) return

		closeModal()
	}

	function handleKeyUp(e) {
		if (closeable && e.key == 'Escape') closeModal()
	}

	function onIntroStart() {
		modalClosed = false
	}
	function onOutroEnd() {
		dispatch('outroend')
	}

	onMount(() => {
		if (forceShow) openModal()
	})
</script>

{#if show}
	<div transition:fade={{duration: 250}} bind:this={modalEl} on:introstart={onIntroStart} on:introend={focus} on:outroend={onOutroEnd} on:click|self={handleBackdropClick} on:keyup|self={handleKeyUp} role="button" tabindex="-1" class="modal {modalClass}">
		<div class="modal-inner" class:closed={modalClosed}>
			{#if modalIcon}
				<div class="modal-ico"><Icon name={modalIcon} /></div>
			{/if}
			<h2>{ header }</h2>
			{#if closeable}
				<button class="modal-close" type="button" on:click|preventDefault={closeModal}>
					<Icon name="x" />
				</button>
			{/if}
			<slot />
		</div>
	</div>
{/if}