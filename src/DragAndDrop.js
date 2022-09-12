import { DOMObserver } from '@untemps/dom-observer'

import { resolveDragImage } from './utils/resolveDragImage'
import { getCSSDeclaration } from './utils/getCSSDeclaration'
import { doElementsOverlap } from './utils/doElementsOverlap'

import './useDropOutside.css'

class DragAndDrop {
	static instances = []

	#target = null
	#dragImage = null
	#dragClassName = null
	#animate = false
	#animateOptions = null
	#dragHandleCentered = false
	#onDropOutside = null
	#onDropInside = null
	#onDragCancel = null

	#observer = null
	#area = null
	#drag = null
	#holdX = 0
	#holdY = 0
	#dragWidth = 0
	#dragHeight = 0

	#boundMouseOverHandler = null
	#boundMouseOutHandler = null
	#boundMouseDownHandler = null
	#boundMouseMoveHandler = null
	#boundMouseUpHandler = null

	static destroy() {
		DragAndDrop.instances.forEach((instance) => {
			instance.destroy()
		})
		DragAndDrop.instances = []
	}

	constructor(
		target,
		areaSelector,
		dragImage,
		dragClassName,
		animate,
		animateOptions,
		dragHandleCentered,
		onDropOutside,
		onDropInside,
		onDragCancel
	) {
		this.#target = target
		this.#dragImage = dragImage
		this.#dragClassName = dragClassName
		this.#animate = animate || false
		this.#animateOptions = { duration: 0.2, timingFunction: 'ease', ...(animateOptions || {}) }
		this.#dragHandleCentered = dragHandleCentered || false
		this.#onDropOutside = onDropOutside
		this.#onDropInside = onDropInside
		this.#onDragCancel = onDragCancel

		this.#area = document.querySelector(areaSelector)

		this.#drag = this.#createDrag()

		this.#boundMouseOverHandler = this.#onMouseOver.bind(this)
		this.#boundMouseOutHandler = this.#onMouseOut.bind(this)
		this.#boundMouseDownHandler = this.#onMouseDown.bind(this)

		this.#target.addEventListener('mouseover', this.#boundMouseOverHandler, false)
		this.#target.addEventListener('mouseout', this.#boundMouseOutHandler, false)
		this.#target.addEventListener('mousedown', this.#boundMouseDownHandler, false)
		this.#target.addEventListener('touchstart', this.#boundMouseDownHandler, false)

		DragAndDrop.instances.push(this)
	}

	update(
		areaSelector,
		dragImage,
		dragClassName,
		animate,
		animateOptions,
		dragHandleCentered,
		onDropOutside,
		onDropInside,
		onDragCancel
	) {
		this.#dragImage = dragImage
		this.#dragClassName = dragClassName
		this.#animate = animate || false
		this.#animateOptions = { duration: 0.2, timingFunction: 'ease', ...(animateOptions || {}) }
		this.#dragHandleCentered = dragHandleCentered || false
		this.#onDropOutside = onDropOutside
		this.#onDropInside = onDropInside
		this.#onDragCancel = onDragCancel

		this.#area = document.querySelector(areaSelector)

		this.#drag = this.#createDrag()
	}

	destroy() {
		this.#target.removeEventListener('mouseover', this.#boundMouseOverHandler)
		this.#target.removeEventListener('mouseout', this.#boundMouseOutHandler)
		this.#target.removeEventListener('mousedown', this.#boundMouseDownHandler)
		this.#target.removeEventListener('touchstart', this.#boundMouseDownHandler)

		this.#boundMouseOverHandler = null
		this.#boundMouseOutHandler = null
		this.#boundMouseDownHandler = null

		this.#observer?.clear()
		this.#observer = null
	}

	#createDrag() {
		const drag = this.#dragImage ? resolveDragImage(this.#dragImage) : this.#target.cloneNode(true)
		drag.setAttribute('draggable', false)
		drag.setAttribute('id', 'drag')
		drag.setAttribute('role', 'presentation')
		drag.classList.add('__drag')
		if (!!this.#dragClassName) {
			const cssText = getCSSDeclaration(this.#dragClassName, true)
			if (!!cssText) {
				drag.style.cssText = cssText
			}
		}

		this.#observer = new DOMObserver()
		this.#observer.wait(drag, null, { events: [DOMObserver.ADD] }).then(() => {
			const { width, height } = drag.getBoundingClientRect()
			this.#dragWidth = width
			this.#dragHeight = height
		})

		return drag
	}

	#animateBack(callback) {
		if (this.#animate) {
			const { width, height, left, top } = this.#target.getBoundingClientRect()
			this.#drag.style.setProperty(
				'--origin-x',
				left - (this.#dragHandleCentered ? (this.#dragWidth - width) >> 1 : 0) + 'px'
			)
			this.#drag.style.setProperty(
				'--origin-y',
				top - (this.#dragHandleCentered ? (this.#dragHeight - height) >> 1 : 0) + 'px'
			)
			this.#drag.style.animation = `move ${this.#animateOptions.duration}s ${this.#animateOptions.timingFunction}`
			this.#drag.addEventListener(
				'animationend',
				() => {
					this.#drag.style.animation = 'none'
					this.#drag.remove()
					callback?.(this.#target, this.#area)
				},
				false
			)
		} else {
			this.#drag.remove()
			callback?.(this.#target, this.#area)
		}
	}

	#onMouseOver(e) {
		e.target.style.cursor = 'grab'
	}

	#onMouseOut(e) {
		e.target.style.cursor = 'default'
	}

	#onMouseMove(e) {
		if (this.#drag.style.visibility === 'hidden') {
			this.#drag.style.visibility = 'visible'
		}

		const pageX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX
		const pageY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY

		this.#drag.style.left = pageX - (this.#dragHandleCentered ? this.#dragWidth >> 1 : this.#holdX) + 'px'
		this.#drag.style.top = pageY - (this.#dragHandleCentered ? this.#dragHeight >> 1 : this.#holdY) + 'px'
	}

	#onMouseDown(e) {
		const clientX = e.type === 'touchstart' ? e.targetTouches[0].clientX : e.clientX
		const clientY = e.type === 'touchstart' ? e.targetTouches[0].clientY : e.clientY
		this.#holdX = clientX - this.#target.getBoundingClientRect().left
		this.#holdY = clientY - this.#target.getBoundingClientRect().top

		this.#drag.style.visibility = 'hidden'
		this.#drag.style.cursor = 'grabbing'

		this.#boundMouseMoveHandler = this.#onMouseMove.bind(this)
		this.#boundMouseUpHandler = this.#onMouseUp.bind(this)

		document.addEventListener('mousemove', this.#boundMouseMoveHandler, false)
		document.addEventListener('mouseup', this.#boundMouseUpHandler, false)
		document.addEventListener('touchmove', this.#boundMouseMoveHandler, false)
		document.addEventListener('keydown', this.#boundMouseUpHandler)
		this.#target.addEventListener('touchend', this.#boundMouseUpHandler, false)
		this.#target.addEventListener('touchcancel', this.#boundMouseUpHandler, false)

		this.#target.parentNode.appendChild(this.#drag)
	}

	#onMouseUp(e) {
		if (e.type.startsWith('key') && e.key !== 'Escape') {
			return
		}

		document.removeEventListener('mousemove', this.#boundMouseMoveHandler)
		document.removeEventListener('mouseup', this.#boundMouseUpHandler)
		document.removeEventListener('touchmove', this.#boundMouseMoveHandler)
		document.removeEventListener('keydown', this.#boundMouseUpHandler)
		this.#target.removeEventListener('touchend', this.#boundMouseUpHandler)
		this.#target.removeEventListener('touchcancel', this.#boundMouseUpHandler)

		this.#boundMouseMoveHandler = null
		this.#boundMouseUpHandler = null

		const doOverlap = doElementsOverlap(this.#area, this.#drag)

		if (e.type.startsWith('key')) {
			this.#animateBack(this.#onDragCancel)
		} else if (doOverlap) {
			this.#animateBack(this.#onDropInside)
		} else {
			this.#drag.remove()
			this.#onDropOutside?.(this.#target, this.#area)
		}
	}
}

export default DragAndDrop
