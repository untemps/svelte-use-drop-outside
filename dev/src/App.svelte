<script>
	import { useDropOutside } from '../../src'

	const _onDropOutside = (node) => {
		alert(`You\'ve just dropped #${node.id} outside the area`)
	}

	const _onDropInside = (node) => {
		alert(`You\'ve just dropped #${node.id} inside the area`)
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
				}}
				class="target"
			>
				Drag me outside the white area
			</div>
		</div>
	</div>
</main>

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
