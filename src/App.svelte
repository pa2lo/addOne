<script>
	import { fade, fly } from 'svelte/transition';
	import { onMount, tick } from 'svelte';
	import Icon from './components/Icon.svelte';
	import RecordsList from './components/RecordsList.svelte';
	import Modal from './components/Modal.svelte';
	import Input from './components/Input.svelte';
	import IcoButton from './components/IcoButton.svelte';
	import Button from './components/Button.svelte';

	let counters = localStorage.getItem('counter') ? JSON.parse(localStorage.getItem('counter')) : []
	let currentCounterIndex = localStorage.getItem('lastCounter') ? parseInt(localStorage.getItem('lastCounter')) : null

	// counter add
	let counterModal = null
	let countersListModal = null
	let countersListModalVisible = false
	let counterForm = {
		header: 'Add new counter',
		name: '',
		limit: 0,
		type: 'add',
		processing: false,
		index: null
	}
	function resetCounterForm() {
		counterForm = {
			header: 'Add new counter',
			name: '',
			limit: 0,
			type: 'add',
			processing: false,
			index: null
		}
	}

	function submitCounterForm() {
		if (!counterForm.limit) counterForm.limit = 0

		counterForm.type == 'add' ? addNewCounter() : editCurrentCounter()
	}
	function addNewCounter() {
		if (counters.some(counter => counter.name == counterForm.name)) return

		counterForm.processing = true
		counterModal.closeModal()

		counters.push({
			name: counterForm.name,
			limit: counterForm.limit,
			records: []
		})
		saveLS()

		setActiveCounter(counters.length - 1)
		if (countersListModalVisible) countersListModal.closeModal()
	}
	function editCurrentCounter() {
		if (counters.filter((iten, index) => index != counterForm.index).some(item => item.name == counterForm.name)) return

		counterForm.processing = true
		counterModal.closeModal()

		counters[counterForm.index].name = counterForm.name
		counters[counterForm.index].limit = counterForm.limit
		saveLS()
	}

	function showEditCounterForm(e, index) {
		let i = index ?? currentCounterIndex
		Object.assign(counterForm, {
			header: 'Edit counter',
			name: counters[i].name,
			limit: counters[i].limit,
			type: 'edit',
			index: i
		})

		counterForm = counterForm

		counterModal.openModal()
	}

	let countersEl = null
	function setActiveCounter(index, inModal) {
		if (isAnimating) return

		if (index > currentCounterIndex) {
			animationDirection.in = '100%'
			animationDirection.out = '-100%'
		} else {
			animationDirection.in = '-100%'
			animationDirection.out = '100%'
		}

		currentCounterIndex = index
		if (index == null) localStorage.removeItem('lastCounter')
		else localStorage.setItem('lastCounter', index)

		scrollToActiveCounter()

		if (inModal) countersListModal.closeModal()
	}
	async function scrollToActiveCounter() {
		if (currentCounterIndex == null) return

		await tick()
		let button = countersEl.querySelector('.active')
		let buttonOffset = button.offsetLeft - countersEl.offsetLeft,
			buttonWidth = button.clientWidth,
			containerOffset = countersEl.scrollLeft,
			containerWidth = countersEl.clientWidth

		if (buttonOffset < containerOffset) countersEl.scrollLeft = buttonOffset - 32
		else if ((buttonOffset + buttonWidth) > (containerOffset + containerWidth)) countersEl.scrollLeft = buttonOffset - 32
	}

	function setNextCounter() {
		if (!counters.length || isAnimating) return

		if (currentCounterIndex == 0) setActiveCounter(counters.length-1)
		else setActiveCounter(currentCounterIndex-1)
	}
	function setPrevCounter() {
		if (!counters.length || isAnimating) return

		if (currentCounterIndex >= counters.length-1) setActiveCounter(0)
		else setActiveCounter(currentCounterIndex+1)
	}

	function deleteCounter(e, index, inModal) {
		if (currentCounterIndex == null || isAnimating) return

		let i = index ?? currentCounterIndex

		confirmAction({
			title: 'Remove counter',
			message: `Are you sure you want to remove counter <strong>${counters[i].name}</strong>?`,
			onConfirm: () => {
				counters.splice(i, 1)
				if (!counters.length) setActiveCounter(null)
				else if (currentCounterIndex+1 > counters.length) setActiveCounter(counters.length-1)
				saveLS()

				if (inModal && !counters.length) countersListModal.closeModal()
			}
		})
	}

	function showCountersList() {
		if (!counters.length) return

		countersListModal.openModal()
		countersListModalVisible = true
	}

	// today yesterday
	const currentDate = new Date()
	const todayDate = currentDate.toLocaleDateString()
	const yesterdayDate = new Date(currentDate.setDate(currentDate.getDate() - 1)).toLocaleDateString()

	// records
	let customRecordModal = null
	let customRecordInput = null
	function addRecord() {
		let lastTimestamp = activeCounter.records.at(-1)
		let now = Date.now()

		if (activeCounter && activeCounter?.limit > 0 && ((activeCounter.limit * 60 * 1000) > (now - lastTimestamp))) {
			confirmAction({
				title: 'Add one',
				message: `Are you sure you want to add new record? The last one was added at<br><big><strong>${new Date(lastTimestamp).toLocaleTimeString()}</strong></big>`,
				onConfirm: () => {
					addRecordHelper(now)
				}
			})
		} else addRecordHelper(now)
	}
	function addRecordHelper(now, isCustom) {
		const add = !counters[currentCounterIndex].records.includes(now)
		showSplashScreen({
			type: add ? 'success' : 'info',
			title: add ? 'Added' : 'Info',
			message: add ? `Record added to <strong>${activeCounter.name}</strong> counter at<br><big><strong>${isCustom ? new Date(now).toLocaleString() : new Date(now).toLocaleTimeString()}</strong></big>` : `Record is already in the counter <strong>${activeCounter.name}</strong>.`,
			onShow: () => {
				if (add) {
					counters[currentCounterIndex].records.push(now)
					saveLS()
					console.log('added')
				}

				if (isCustom) customRecordModal.closeModal()
			}
		})
	}

	function openAddRecordModal() {
		customRecordInput = new Date().toLocaleString('SV').split(':').slice(0, -1).join(':')

		customRecordModal.openModal()
	}
	function addCustomRecord() {
		if (currentCounterIndex == null || !customRecordInput) return
		addRecordHelper(new Date(customRecordInput).getTime(), true)
	}

	function deleteRecord(ev) {
		if (ev.detail.timestamp) {
			confirmAction({
				title: 'Remove record',
				message: `Are you sure you want to remove <strong>${ev.detail.string}</strong> from the <strong>${activeCounter.name}</strong> counter?`,
				onConfirm: () => {
					let index = counters[currentCounterIndex].records.findIndex(item => ev.detail.timestamp == item)
					if (index < 0) return
					counters[currentCounterIndex].records.splice(index, 1)
					saveLS()
				}
			})
		}
	}

	function saveLS() {
		counters = counters
		localStorage.setItem('counter', JSON.stringify(counters))
	}

	// computed
	$: activeCounter = currentCounterIndex == null ? null : counters[currentCounterIndex]
	$: activeCounterRecords = () => {
		if (!activeCounter || !activeCounter?.records?.length) return {}

		let lastTS = 0

		let sortedArr = [...new Set(activeCounter.records.sort((a, b) => a - b))]

		let reducedData = sortedArr.reduce((acc, item) => {
			let date = new Date(item)
			let dayString = date.toLocaleDateString()

			let itemObj = {
				string: date.toLocaleTimeString(),
				timestamp: item
			}
			if (activeCounter?.limit > 0) {
				itemObj.warning = (item - lastTS) < (activeCounter.limit * 60 * 1000)
				lastTS = item
			}

			if (acc[dayString]) acc[dayString].push(itemObj)
			else acc[dayString] = [itemObj]

			return acc
		}, {})

		Object.keys(reducedData).forEach(key => reducedData[key].sort((a, b) => b.timestamp - a.timestamp))

		return reducedData
	}

	// export / import
	let exportImportModal = null
	function exportAll() {
		const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(counters))}`;
		const link = document.createElement('a');
		link.href = jsonString;
		link.download = `all-counters.json`;

		link.click();
	}
	function exportCurrent() {
		if (!activeCounter) return

		const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(activeCounter.records))}`;
		const link = document.createElement('a');
		link.href = jsonString;
		link.download = `${activeCounter.name}.json`;

		link.click();
	}

	function showImportError(title, message) {
		showSplashScreen({
			type: 'error',
			title: title,
			message: message || ''
		})
	}
	function importData(type) {
		const input = document.createElement('input')
		input.type = 'file'
		input.onchange = (e) => {
			if (input.files) {
				const file = input.files[0]
				if (file.name.includes('.json') && file.type == 'application/json') {
					const reader = new FileReader()
					reader.onerror = (err) => showImportError('Failed to read a file', err || '')

					reader.onload = (data) => {
						try {
							if (typeof data.target.result != 'string') return showImportError('Unsupported data format')

							let fileData = JSON.parse(data.target.result)

							if (Array.isArray(fileData) && checkData(fileData, type)) {
								if (type == 'current') importCurrent(fileData)
								else importAll(fileData)
							} else showImportError('Unsupported data format')
						} catch (err) {
							showImportError('Import error', err || '')
						}
					}

					reader.readAsText(file)
				} else {
					showImportError('Unsupported file format')
				}
			}
		}
		input.click()
	}

	function checkData(data, type) {
		if (type == 'current') return data.length && data.every(item => typeof item == 'number')
		else return data.length && data.every(item => typeof item == 'object' && item.name && item.records)
	}

	function importCurrent(data) {
		if (activeCounter.records.length) {
			confirmAction({
				title: 'Import records',
				message: `Counter <strong>${activeCounter.name}</strong> already contains <strong>${activeCounter.records.length}</strong> records. Import will overwrite these records with records from the file. Do you want to import the file and overwrite counters records?`,
				onConfirm: () => importCurrentData('replace', data),
				onCancel: () => {
					setTimeout(() => {
						confirmAction({
							title: 'Append records',
							message: `Do you want to append <strong>${data.length}</strong> records from the file to the <strong>${activeCounter.name}</strong> counter?`,
							onConfirm: () => importCurrentData('append', data)
						})
					}, 275)
				}
			})
		} else importCurrentData('replace', data)
	}
	function importCurrentData(type, data) {
		exportImportModal.closeModal()
		if (countersListModalVisible) countersListModal.closeModal()

		showSplashScreen({
			title: 'Records imported',
			message: `<strong>${data.length}</strong> records imported to the <strong>${activeCounter.name}</strong> counter.`,
			onShow: () => {
				if (type == 'replace') counters[currentCounterIndex].records = data
				else if (type == 'append') counters[currentCounterIndex].records = [...counters[currentCounterIndex].records, ...data]
				saveLS()
			}
		})
	}

	function importAll(data) {
		if (counters.length) {
			confirmAction({
				title: 'Import counters',
				message: `You have already <strong>${counters.length}</strong> counters. Import will replace your counters with counters from the file. Do you want to import the file and replace your counters?`,
				onConfirm: () => importAllData('replace', data),
				onCancel: () => {
					setTimeout(() => {
						confirmAction({
							title: 'Append counters',
							message: `Do you want to append <strong>${data.length}</strong> counters from the file to your existing counter list?`,
							onConfirm: () => importAllData('append', data)
						})
					}, 275)
				}
			})
		} else importAllData('replace', data)
	}
	function importAllData(type, data) {
		exportImportModal.closeModal()
		if (countersListModalVisible) countersListModal.closeModal()

		showSplashScreen({
			title: `${data.length > 1 ? 'Counters' : 'Counter'} imported`,
			message: `<strong>${data.length}</strong> ${data.length > 1 ? 'counters' : 'counter'} imported.`,
			onShow: () => {
				if (type == 'replace') counters = data
				else if (type == 'append') counters = [...counters, ...data]
				saveLS()
				if (!currentCounterIndex || type == 'replace') setActiveCounter(0)
			}
		})
	}

	// confirm
	let confirmModal = null
	let confirmData = {
		title: 'Confirm',
		message: '',
		onConfirm: null,
		onCancel: null
	}
	function confirmAction(options) {
		confirmData.title = options.title || ''
		confirmData.message = options.message || ''
		confirmData.onConfirm = options.onConfirm || null
		confirmData.onCancel = options.onCancel || null

		confirmModal.openModal()
	}
	function onConfirmConfirm() {
		if (confirmData.onConfirm) confirmData.onConfirm()

		confirmModal.closeModal()
	}
	function onConfirmCancel() {
		if (confirmData.onCancel) confirmData.onCancel()

		confirmModal.closeModal()
	}

	// Splash screen
	let splashScreenClosed = true
	let splashScreenData = {
		type: 'success',
		title: 'Success',
		message: '',
		show: false,
		onShow: null,
		timeout: 5000
	}
	let splashScreenTimeout = null
	const splashScreenIconsMap = {
		'success': 'check-animated',
		'error': 'alert-animated',
		'info': 'info-animated'
	}
	function showSplashScreen(options) {
		splashScreenData.type = options.type || 'success'
		splashScreenData.title = options.title || 'Success'
		splashScreenData.message = options.message || ''
		splashScreenData.onShow = options.onShow || null
		splashScreenData.timeout = options.timeout || 5000

		splashScreenData.show = true

		splashScreenTimeout = setTimeout(() => {
			closeSplashScreen()
		}, splashScreenData.timeout);
	}
	function onSplashScreenShow() {
		if (splashScreenData.onShow) splashScreenData.onShow()
	}
	function closeSplashScreen() {
		clearTimeout(splashScreenTimeout)
		splashScreenClosed = true
		requestAnimationFrame(() => {
			splashScreenData.show = false
		})
	}

	// animation
	let footerEl = null
	let headerEl = null
	let mainEl = null
	let isAnimating = false
	let animationDirection = {
		in: '100%',
		out: '-100%'
	}
	function flyStart(e) {
		isAnimating = true
		let target = e.target

		target.style.setProperty('--headerHeight', `${headerEl.clientHeight}px`)
		target.style.setProperty('--footerHeight', `${footerEl.clientHeight}px`)
		target.style.setProperty('--elWidth', `${mainEl.clientWidth}px`)
		target.style.setProperty('--elOffset', `${mainEl.offsetLeft}px`)
		target.style.setProperty('--winHeight', `${window.innerHeight}px`)

		target.classList.add('flyIn')
	}
	function flyEnd(e) {
		isAnimating = false

		e.target.classList.remove('flyIn')
	}

	// app install
	let showSafariInstall = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS|EdgiOS|OPiOS|mercury|Opera Mini/.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches

	let installPrompt = null
	let showInstallPrompt = false
	let installModal = null
	function installApp() {
		if (!installPrompt) return
		installPrompt.prompt()
		installPrompt.userChoice.then(outcome => {
			if (outcome === 'accepted') {
				installPrompt = null
				installModal.closeModal()
			}
		})
	}

	// onMount
	onMount(() => {
		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault()
			installPrompt = e
			showInstallPrompt = true
		})

		if (currentCounterIndex) scrollToActiveCounter()
	})

	// touch swipe
	const touchEventsMap = {
		main: {
			swipeLeft: () => setPrevCounter(),
			swipeRight: () => setNextCounter()
		},
		footer: {
			swipeUp: () => showCountersList()
		}
	}
	function handleTouchEvents(e, type) {
		if (!e.changedTouches.length || window.visualViewport.scale > 1.01) return

		const startX = e.changedTouches[0].screenX
		const startY = e.changedTouches[0].screenY

		document.addEventListener('touchend', (ev) => {
			if (!ev.changedTouches.length || window.visualViewport.scale > 1.01) return
			const { screenX: endX, screenY: endY } = ev.changedTouches[0]

			let diffX = endX - startX,
				diffY = endY - startY,
				absDiffY = Math.abs(diffY),
				absDiffX = Math.abs(diffX)

			if (absDiffX > absDiffY && absDiffY < 50 && absDiffX > 80) diffX < 0 ? touchEventsMap[type]?.swipeLeft?.() : touchEventsMap[type]?.swipeRight?.()
			else if (absDiffY > absDiffX && absDiffX < 50 && absDiffY > 80) diffY < 0 ? touchEventsMap[type]?.swipeUp?.() : touchEventsMap[type]?.swipeDown?.()
		}, {once: true})
	}
</script>

<header class="header" bind:this={headerEl}>
	<div class="header-inner cont">
		{#if installPrompt}
			<IcoButton icon="circle-down" title="Install" on:click={installApp} />
		{/if}
		<h1 class="header-title">
			{#if activeCounter }
				{#key currentCounterIndex}
					<span in:fade={{delay: 150, duration: 150}} out:fade={{duration: 150}}>{ activeCounter.name }</span>
				{/key}
			{:else}
				<span in:fade={{delay: 150, duration: 150}} out:fade={{duration: 150}}>AddOne</span>
			{/if}
		</h1>
		{#if activeCounter }
			<div class="header-buttons">
				<IcoButton icon="edit" title="Edit" on:click={showEditCounterForm} />
				<IcoButton icon="trash" title="Delete" on:click={deleteCounter} />
			</div>
		{/if}
	</div>
</header>

<div class="main-outer" bind:this={mainEl} on:touchstart={(e) => handleTouchEvents(e, 'main')}>
	{#key currentCounterIndex}
		<main class="main" in:fly={{x: animationDirection.in}} out:fly={{x: animationDirection.out}} on:introstart={flyStart} on:introend={flyEnd}>
			{#if activeCounter}
				{#if !activeCounter.records?.length}
					<div in:fade={{duration: 250, delay: 250}} out:fade={{duration: 250}} class="noCounters">
						<h2>You have no records yet in this counter!</h2>
					</div>
				{:else}
					<div in:fade={{duration: 250, delay: 250}} out:fade={{duration: 250}} class="counterData">
						{#each Object.entries(activeCounterRecords()).reverse() as [title, times], ii}
							<RecordsList {times} {title} expanded={ii == 0} isToday={todayDate == title} isYesterday={yesterdayDate == title} on:deleteRecord={deleteRecord} />
						{/each}
						<p class="centered">
							<Button buttonClass="default" icon="plus" on:click={openAddRecordModal}>Add custom record</Button>
						</p>
					</div>
				{/if}
			{:else}
				<div class="noCounters empty">
					<h2>You have no counters yet</h2>
					<p>
						<Button on:click={() => counterModal.openModal()}>Add counter</Button>
					</p>
					<p class="line-smaller">or</p>
					<p class="line-smaller">
						<Button on:click={() => importData('all')}>Import data</Button>
					</p>
				</div>
			{/if}
		</main>
	{/key}
</div>

<footer class="footer" class:isInactive={!activeCounter} bind:this={footerEl}>
	<div class="cont footer-cont" on:touchstart={(e) => handleTouchEvents(e, 'footer')}>
		<Button icon="plus" full bigger on:click={addRecord}>Add One Now</Button>
		<aside class="counterItems">
			<div bind:this={countersEl} class="counterItems-list">
				{#if counters.length}
					{#each counters as item, i}
						<IcoButton text={item.name} active={i == currentCounterIndex} on:click={() => setActiveCounter(i)} />
					{/each}
				{/if}
			</div>
			<div class="counterItems-actions">
				<IcoButton icon="list" title="Counters list" on:click={showCountersList} />
				<IcoButton icon="plus" title="Add counter" on:click={() => counterModal.openModal()} />
			</div>
		</aside>
	</div>
</footer>

<Modal bind:this={countersListModal} modalClass="modal-countersList" header="Counters" closeable on:outroend={() => countersListModalVisible = false}>
	{#if counters.length}
		<div class="countersList-items">
			{#each counters as item, i}
				<div class="countersList-item">
					<button class="countersList-textButton" class:active={i == currentCounterIndex} on:click|preventDefault={() => setActiveCounter(i, true)}>
						<span class="countersList-textButton-title">{item.name}</span>
						{#if item.records.length}
							<span class="countersList-textButton-count">({item.records.length} {item.records.length > 1 ? 'records' : 'record'})</span>
						{/if}
					</button>
					<button class="countersList-icoButton" on:click|preventDefault={() => showEditCounterForm(null, i)} title="Edit"><Icon name="edit" /></button>
					<button class="countersList-icoButton" on:click|preventDefault={() => deleteCounter(null, i, true)} title="Delete"><Icon name="trash" /></button>
				</div>
			{/each}
		</div>
	{/if}
	<p class="line-smaller">
		<Button icon="plus" full on:click={() => counterModal.openModal()}>New counter</Button>
	</p>
	<p>
		<Button icon="updown" buttonClass="default" full on:click={() => exportImportModal.openModal()}>Import / export</Button>
	</p>
</Modal>

<Modal bind:this={customRecordModal} header="Add record" closeable>
	<form on:submit|preventDefault={addCustomRecord} class="line">
		<Input required id="add-datetime" label="Date / time"  type="datetime-local" bind:value={customRecordInput} />
		<p class="line-bigger">
			<Button full submit>Add record</Button>
		</p>
	</form>
</Modal>

<Modal bind:this={counterModal} header={counterForm.header} on:outroend={resetCounterForm} closeable>
	<form on:submit|preventDefault={submitCounterForm} class="line">
		<Input required id="add-name" label="Name" placeholder="coffee" bind:value={counterForm.name}>
			{#if counterForm.type == 'add' && counters.some(counter => counter.name == counterForm.name)}
				{#if !counterForm.processing}
					<div class="input-error">Counter with this name already exists!</div>
				{/if}
			{:else if counters.filter((iten, index) => index != counterForm.index).some(item => item.name == counterForm.name)}
				<div class="input-error">Counter with this name already exists!</div>
			{/if}
		</Input>
		<Input required id="add-limit" label="Limit (minutes)" type="number" bind:value={counterForm.limit}>
			<div class="input-note">
				Show a warning if you want to add a new record before the specified time after the last one.
			</div>
		</Input>
		<p>
			<Button full submit>{ counterForm.type == 'add' ? 'Add counter' : 'Edit counter' }</Button>
		</p>
	</form>
</Modal>

<Modal bind:this={exportImportModal} modalClass="centered" header="Export / Import" closeable>
	{#if activeCounter}
		<h3>Counter - { activeCounter.name }</h3>
		<p class="modal-buttons line-smaller">
			<Button disabled={!activeCounter.records.length} on:click={exportCurrent}>Export</Button>
			<Button on:click={() => importData('current')}>Import</Button>
		</p>
	{/if}
	<h3>All counters</h3>
	<p class="modal-buttons line-smaller">
		<Button on:click={exportAll}>Export all</Button>
		<Button on:click={() => importData('all')}>Import all</Button>
	</p>
</Modal>

<Modal bind:this={confirmModal} modalIcon="alert-animated" modalClass="centered" header={confirmData.title}>
	{#if confirmData.message}
		<p class="line-smaller">{@html confirmData.message}</p>
	{/if}
	<p class="modal-buttons">
		<Button on:click={onConfirmCancel}>No</Button>
		<Button buttonClass="reject" on:click={onConfirmConfirm}>Yes</Button>
	</p>
</Modal>

{#if splashScreenData.show}
	<div transition:fade={{duration: 250}} on:introstart={() => splashScreenClosed = false} on:introend={onSplashScreenShow} class="splashScreen" style="--timeout: {splashScreenData.timeout}ms;">
		<div class="splashScreen-inner centered" class:closed={splashScreenClosed}>
			<div class="splashScreen-ico"><Icon name={splashScreenIconsMap[splashScreenData.type]} /></div>
			<h2>{ splashScreenData.title }</h2>
			{#if splashScreenData.message}
				<p class="line-smaller">{@html splashScreenData.message}</p>
			{/if}
			<p>
				<Button buttonClass="wider" on:click={closeSplashScreen}>OK</Button>
			</p>
		</div>
	</div>
{/if}

{#if showSafariInstall}
	<Modal header="Install app" closeable forceShow>
		<p>
			1. Press the "Share" button
			<img src="/images/step1.png" class="iosInstallHelp-img" alt="" />
		</p>
		<p>
			2. Select "Add to Home Screen" from the popup
			<img src="/images/step2.png" class="iosInstallHelp-img" alt="" />
		</p>
		<p>
			3. Tap "Add" in the top right corner
			<img src="/images/step3.png" class="iosInstallHelp-img" alt="" />
		</p>
	</Modal>
{:else if showInstallPrompt}
	<Modal bind:this={installModal} modalClass="centered" closeable forceShow>
		<p class="modal-ico noMargin">
			<Icon name="download-animated" />
		</p>
		<h2>Install app</h2>
		<p class="line-smaller">Do you want to install <strong>AddOne</strong> as app to your device?</p>
		<p>
			<Button full on:click={installApp}>Install</Button>
		</p>
	</Modal>
{/if}