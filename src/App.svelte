<script>
	import { useDropOutside } from '@untemps/svelte-use-drop-outside'

	import SettingsIcon from './SettingsIcon.svelte'
	import CloseIcon from './CloseIcon.svelte'

	const colors = [
		'#865C54',
		'#8F5447',
		'#A65846',
		'#A9715E',
		'#AD8C72',
		'#C2B091',
		'#172B41',
		'#32465C',
		'#617899',
		'#9BA2BC',
		'#847999',
		'#50526A',
		'#8B8C6B',
		'#97A847',
		'#5B652C',
		'#6A6A40',
		'#F2D9BF',
		'#F5BAAE',
		'#F1A191',
	]

	let showSettings = false

	let animate = false
	let useDragClass = false
	let useDragImage = false
	let isHandleCentered = false

	const _onDropOutside = (node, area) => {
		node.remove()
	}

	const _onDropInside = () => {
		console.log('Dropped inside!')
	}

	const _onDragCancel = () => {
		console.log('Drag cancelled!')
	}
</script>

<style>
	main {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 1rem;
		background-color: #617899;
	}

	.container {
		max-width: 640px;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		row-gap: 0.5rem;
	}

	.area {
		width: 300px;
		height: 300px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: white;
		box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.5);
	}

	.slot-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		grid-gap: 1rem;
		align-items: center;
		justify-items: center;
	}

	.slot {
		width: 24px;
		height: 24px;
		margin: 0;
		padding: 0;
		border: 1px solid rgba(0, 0, 0, 0.2);
		border-radius: 50%;
	}

	:global(.drag) {
		opacity: 0.5;
		background-color: deeppink;
		border-radius: 0;
		width: 100px;
		height: 100px;
	}

	.toggle__button {
		background: none;
		border: none;
		color: white;
		cursor: pointer;
		width: 36px;
	}

	.settings__container {
		overflow: hidden auto;
		position: absolute;
		z-index: 9999;
		width: 100vw;
		max-width: 320px;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.settings__form {
		width: 100%;
		height: 400px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 1rem;
		background-color: #fafafa;
		border-radius: 1rem;
	}

	.settings__form fieldset {
		width: 100%;
		border: none;
		display: flex;
	}

	.settings__form fieldset.horizontal {
		align-items: center;
		justify-content: space-between;
		column-gap: 1rem;
	}

	.settings__form input {
		margin: 0;
	}

	.settings__form input[type='checkbox'] {
		padding: 0;
	}
</style>

<main>
	{#if showSettings}
		<div class="settings__container">
			<button type="button" class="toggle__button" on:click={() => (showSettings = !showSettings)}>
				<CloseIcon />
			</button>
			<form class="settings__form">
				<h1>Settings</h1>
				<fieldset class="horizontal">
					<label for="animate"> Animate Drag Back: </label>
					<input id="animate" type="checkbox" bind:checked={animate} />
				</fieldset>
				<fieldset class="horizontal">
					<label for="useDragCustomClass"> Use Drag Class: </label>
					<input id="useDragCustomClass" type="checkbox" bind:checked={useDragClass} />
				</fieldset>
				<fieldset class="horizontal">
					<label for="useDragImage"> Use Drag Image: </label>
					<input id="useDragImage" type="checkbox" bind:checked={useDragImage} />
				</fieldset>
				<fieldset class="horizontal">
					<label for="isHandleCentered"> Center Handle: </label>
					<input id="isHandleCentered" type="checkbox" bind:checked={isHandleCentered} />
				</fieldset>
			</form>
		</div>
	{/if}

	<div class="container">
		<button type="button" class="toggle__button" on:click={() => (showSettings = !showSettings)}>
			<SettingsIcon />
		</button>
		<div id="area" class="area">
			<ul class="slot-list">
				{#each colors as color, index}
					<li
						use:useDropOutside={{
							areaSelector: '.area',
							animate,
							animateOptions: {
								timingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
							},
							dragImage: useDragImage
								? {
										src: 'https://www.123-stickers.com/7345-thickbox/autocollant-bebe-winnie-l-ourson.jpg',
										height: 70,
								  }
								: null,
							dragClassName: useDragClass ? 'drag' : null,
							dragHandleCentered: isHandleCentered,
							onDropOutside: _onDropOutside,
							onDropInside: _onDropInside,
							onDragCancel: _onDragCancel,
						}}
						style={`background-color: ${color}`}
						class="slot"></li>
				{/each}
			</ul>
		</div>
	</div>
</main>
