import { resolveDragImage } from './utils/resolveDragImage'

// TODO: Add classes for drag operations
// TODO: Add callback for drag cancellation
// TODO: Fix drop outside window boundaries
const useDropOutside = (node, { areaSelector, dragImage, onDropOutside, onDropInside }) => {
	const safeArea = document.querySelector(areaSelector)

	const _onDragStart = (e) => {
		e.dataTransfer.effectAllowed = 'move'
		e.dataTransfer.setData('text/plain', '')

		const source = resolveDragImage(dragImage)
		if (!!source) {
			e.dataTransfer.setDragImage(source.imgElement, source.xOffset, source.yOffset)
		}

		document.addEventListener('dragover', _onDragOver)
		document.addEventListener('drop', _onDrop)
		
		node.addEventListener('dragend', _onDragEnd)
	}

	const _onDragOver = (e) => {
		e.preventDefault()

		
		if (e.target === safeArea || safeArea.contains(e.target)) {
			e.dataTransfer.dropEffect = 'none'
		}
	}

	const _onDragEnd = (e) => {
		e.preventDefault()

		document.removeEventListener('dragover', _onDragOver)
		document.removeEventListener('drop', _onDrop)
		
		onDropInside?.(node)
	}

	const _onDrop = (e) => {
		e.preventDefault()

		document.removeEventListener('dragover', _onDragOver)
		document.removeEventListener('drop', _onDrop)

		if (e.target !== safeArea && !safeArea.contains(e.target)) {
			onDropOutside?.(node)
			
			node.removeEventListener('dragend', _onDragEnd)
		}
	}

	node.draggable = true
	node.addEventListener('dragstart', _onDragStart)

	return {
		destroy() {
			node.draggable = false
			node.removeEventListener('dragstart', _onDragStart)
			node.removeEventListener('dragend', _onDragEnd)
		},
	}
}

export default useDropOutside
