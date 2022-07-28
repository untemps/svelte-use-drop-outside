<script>
	import { useDropOutside } from '@untemps/svelte-use-drop-outside'

	const _onDropOutside = (node) => {
		alert(`You\'ve just dropped #${node.id} outside the area`)
	}

	const _onDropInside = (node) => {
		alert(`You\'ve just dropped #${node.id} inside the area`)
	}

  const _onDragCancel = (node) => {
    alert(`You\'ve just cancelled the drag of #${node.id}`)
  }
</script>

<main>
	<div class="container">
		<div class="area">
			<div
				id="target"
				use:useDropOutside={{
					areaSelector: '.area',
					onDropOutside: _onDropOutside,
					onDropInside: _onDropInside,
					onDragCancel: _onDragCancel,
				}}
				class="target"
			>
				Drag me outside the white area
			</div>
		</div>
	</div>
</main>
<template id="drag-image">
  <img src="https://cdn-icons-png.flaticon.com/512/636/636045.png" alt="dragging" width="48" height="48"/>
</template>

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
		align-items: center;
		row-gap: 3rem;
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

	.target {
		width: 10rem;
		background-color: black;
		color: white;
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}
</style>
