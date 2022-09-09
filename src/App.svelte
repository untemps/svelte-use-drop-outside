<script>
	import { useDropOutside } from '@untemps/svelte-use-drop-outside'

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
      row-gap: 1rem;
	}

	.instruction {
		margin: 0;
		padding: 0;
		color: white;
		font-family: Georgia, serif;
		width: 300px;
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
</style>

<main>
	<div class="container">
		<p class="instruction">Drop the color slots outside the white area</p>
		<div id="area" class="area">
			<ul class="slot-list">
				{#each colors as color, index}
					<li
						use:useDropOutside={{
							areaSelector: '.area',
							animate: true,
							animateOptions: {
								timingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
							},
							onDropOutside: _onDropOutside,
							onDropInside: _onDropInside,
							onDragCancel: _onDragCancel,
						}}
						style={`background-color: ${color}`}
						class="slot" />
				{/each}
			</ul>
		</div>
	</div>
</main>
