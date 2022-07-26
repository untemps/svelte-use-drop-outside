import { DOMObserver } from '@untemps/dom-observer'

import { resolveDragImage } from './utils/resolveDragImage'
import { doElementsOverlap } from './utils/doElementsOverlap'

let holdX = 0
let holdY = 0
let observer = null
let drag = null
let dragWidth = 0
let dragHeight = 0

const useDropOutside = (node, { areaSelector, dragImage, onDropOutside, onDropInside, onDragCancel }) => {
	const area = document.querySelector(areaSelector)

	const onMouseOver = (e) => {
		e.target.style.cursor = 'grab'
	}

	const onMouseOut = (e) => {
		e.target.style.cursor = 'default'
	}

	const onMouseMove = (e) => {
		if (!drag.parentNode) {
			node.parentNode.appendChild(drag)
		}

		const pageX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX
		const pageY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY

		drag.style.left = pageX - (dragImage ? dragWidth >> 1 : holdX) + 'px'
		drag.style.top = pageY - (dragImage ? dragHeight >> 1 : holdY) + 'px'
	}

	const onMouseDown = (e) => {
		const clientX = e.type === 'touchstart' ? e.targetTouches[0].clientX : e.clientX
		const clientY = e.type === 'touchstart' ? e.targetTouches[0].clientY : e.clientY
		holdX = clientX - node.getBoundingClientRect().left
		holdY = clientY - node.getBoundingClientRect().top

		drag.style.cursor = 'grabbing'

		document.addEventListener('mousemove', onMouseMove, false)
		document.addEventListener('mouseup', onMouseUp, false)
		document.addEventListener('touchmove', onMouseMove, false)
		document.addEventListener('keydown', onMouseUp)
		node.addEventListener('touchend', onMouseUp, false)
		node.addEventListener('touchcancel', onMouseUp, false)
	}

	const onMouseUp = (e) => {
		if (e.type.startsWith('key') && e.key !== 'Escape') {
			return
		}

		document.removeEventListener('mousemove', onMouseMove)
		document.removeEventListener('mouseup', onMouseUp)
		document.removeEventListener('touchmove', onMouseMove)
		document.removeEventListener('keydown', onMouseUp)
		node.removeEventListener('touchend', onMouseUp)
		node.removeEventListener('touchcancel', onMouseUp)

		const doOverlap = doElementsOverlap(area, drag)

		drag.remove()

		setTimeout(() => {
			if (e.type.startsWith('key')) {
				onDragCancel?.(node)
			} else if (doOverlap) {
				onDropInside?.(node)
			} else {
				onDropOutside?.(node)
			}
		}, 10)
	}

	observer = new DOMObserver()

	drag = dragImage ? resolveDragImage(dragImage) : node.cloneNode(true)
	drag.draggable = false
	drag.id = 'drag-clone'
	drag.role = 'presentation'
	drag.style.position = 'absolute'
	drag.style.zIndex = '1000'
	drag.style.opacity = '0.7'
	drag.style.userSelect = 'none'
	observer.wait(drag, null, { events: [DOMObserver.ADD] }).then(({ node: dnode }) => {
		const { width, height } = drag.getBoundingClientRect()
		dragWidth = width
		dragHeight = height
	})

	node.addEventListener('mouseover', onMouseOver, false)
	node.addEventListener('mouseout', onMouseOut, false)
	node.addEventListener('mousedown', onMouseDown, false)
	node.addEventListener('touchstart', onMouseDown, false)

	return {
		destroy() {
			observer.clear()
			node.removeEventListener('mouseover', onMouseOver)
			node.removeEventListener('mouseout', onMouseOut)
			node.removeEventListener('mousedown', onMouseDown)
			node.removeEventListener('touchstart', onMouseDown)
		},
	}
}

export default useDropOutside
