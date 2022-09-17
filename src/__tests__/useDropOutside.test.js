/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from '@testing-library/dom'

import { createElement } from '@untemps/utils/dom/createElement'
import { getElement } from '@untemps/utils/dom/getElement'

import DragAndDrop from '../DragAndDrop'
import useDropOutside from '../useDropOutside'

const areaSize = 200
const targetSize = 100

const createStyle = () => {
	createElement({
		tag: 'style',
		textContent: `
		.gag {
		  background-color: black;
    }
    .pol {
      background-color: red;
    }
    `,
		parent: document.body,
	})
}

const createArea = (id) => {
	const el = createElement({
		tag: 'div',
		attributes: { id, class: 'foo', style: `width: ${areaSize}; height: ${areaSize};` },
		parent: document.body,
	})
	el.getBoundingClientRect = () => ({
		width: areaSize,
		height: areaSize,
		top: 0,
		left: 0,
		right: areaSize,
		bottom: areaSize,
	})
	return el
}

const createTarget = (id, parent) => {
	return createElement({
		tag: 'div',
		attributes: { id, class: 'bar', style: `width: ${targetSize}; height: ${targetSize};` },
		parent,
	})
}

describe('useDropOutside', () => {
	let area,
		target,
		options = null

	let action = null

	beforeEach(() => {
		createStyle()
		area = createArea('area')
		target = createTarget('target', area)
		options = {
			areaSelector: '#area',
		}
	})

	afterEach(() => {
		area = null
		target = null
		options = null

		fireEvent.mouseUp(document)

		document.body.innerHTML = ''

		action?.destroy()

		DragAndDrop.destroy()
	})

	describe('init', () => {
		it('Sets pointer to grab on mouseover', async () => {
			action = useDropOutside(target, options)

			fireEvent.mouseOver(target)

			expect(target.style.cursor).toBe('grab')
		})

		it('Sets pointer to default on mouseout', async () => {
			action = useDropOutside(target, options)

			fireEvent.mouseOver(target)
			fireEvent.mouseOut(target)

			expect(target.style.cursor).toBe('default')
		})

		it('Sets pointer to grabbing on mousedown', async () => {
			action = useDropOutside(target, options)

			fireEvent.mouseDown(target)
			fireEvent.mouseMove(document)

			const drag = getElement('#drag')

			expect(drag.style.cursor).toBe('grabbing')
		})

		it('Removes dragged element on mouseup', async () => {
			action = useDropOutside(target, options)

			fireEvent.mouseDown(target)
			fireEvent.mouseMove(document)

			const drag = getElement('#drag')

			expect(drag).toBeInTheDocument()

			fireEvent.mouseUp(document)

			expect(drag).not.toBeInTheDocument()
		})

		it('Triggers onDropInside callback', async () => {
			const onDropInside = jest.fn()
			action = useDropOutside(target, { ...options, animate: true, onDropInside })

			fireEvent.touchStart(target, { targetTouches: [{ pageX: 10, pageY: 10 }] })
			fireEvent.touchMove(document, { targetTouches: [{ pageX: 10, pageY: 10 }] })
			fireEvent.touchMove(document, { targetTouches: [{ pageX: 10, pageY: 10 }] }) // Duplicate on purpose

			const drag = document.querySelector('#drag')
			drag.getBoundingClientRect = () => ({
				width: targetSize,
				height: targetSize,
				top: 0,
				left: 0,
				right: targetSize,
				bottom: targetSize,
			})

			fireEvent.mouseUp(document)
			fireEvent.animationEnd(screen.getByRole('presentation'))

			expect(onDropInside).toHaveBeenCalled()
		})

		it('Triggers onDropInside callback on update', async () => {
			const onDropInside = jest.fn()
			const onDropInsideRepl = jest.fn()
			action = useDropOutside(target, { ...options, onDropInside })
			action.update({ onDropInside: onDropInsideRepl })

			fireEvent.touchStart(target, { targetTouches: [{ pageX: 10, pageY: 10 }] })
			fireEvent.touchMove(document, { targetTouches: [{ pageX: 10, pageY: 10 }] })
			fireEvent.touchMove(document, { targetTouches: [{ pageX: 10, pageY: 10 }] }) // Duplicate on purpose

			const drag = document.querySelector('#drag')
			drag.getBoundingClientRect = () => ({
				width: targetSize,
				height: targetSize,
				top: 0,
				left: 0,
				right: targetSize,
				bottom: targetSize,
			})

			fireEvent.mouseUp(document)

			expect(onDropInsideRepl).toHaveBeenCalled()
		})

		it('Triggers onDropOutside callback', async () => {
			const onDropOutside = jest.fn()
			action = useDropOutside(target, { ...options, onDropOutside })

			fireEvent.mouseDown(target)
			fireEvent.mouseMove(document)

			const drag = document.querySelector('#drag')
			drag.getBoundingClientRect = () => ({
				width: targetSize,
				height: targetSize,
				top: areaSize + 10,
				left: areaSize + 10,
				right: areaSize + 10 + targetSize,
				bottom: areaSize + 10 + targetSize,
			})

			fireEvent.mouseUp(document)

			expect(onDropOutside).toHaveBeenCalled()
		})

		it('Triggers onDropOutside callback on update', async () => {
			const onDropOutside = jest.fn()
			const onDropOutsideRepl = jest.fn()
			action = useDropOutside(target, { ...options, onDropOutside })
			action.update({ onDropOutside: onDropOutsideRepl })

			fireEvent.mouseDown(target)
			fireEvent.mouseMove(document)

			const drag = document.querySelector('#drag')
			drag.getBoundingClientRect = () => ({
				width: targetSize,
				height: targetSize,
				top: areaSize + 10,
				left: areaSize + 10,
				right: areaSize + 10 + targetSize,
				bottom: areaSize + 10 + targetSize,
			})

			fireEvent.mouseUp(document)

			expect(onDropOutsideRepl).toHaveBeenCalled()
		})

		it('Triggers onDragCancel callback', async () => {
			const onDragCancel = jest.fn()
			action = useDropOutside(target, { ...options, animate: true, onDragCancel })

			fireEvent.mouseDown(target)
			fireEvent.mouseMove(document)
			fireEvent.keyDown(document, { key: 'A', code: 'A' })
			fireEvent.keyDown(document, { key: 'Escape', code: 'Esc' })
			fireEvent.animationEnd(screen.getByRole('presentation'))

			expect(onDragCancel).toHaveBeenCalled()
		})

		it('Triggers onDragCancel callback on update', async () => {
			const onDragCancel = jest.fn()
			const onDragCancelRepl = jest.fn()
			action = useDropOutside(target, { ...options, animate: true, onDragCancel })
			action.update({ animate: false, onDragCancel: onDragCancelRepl })

			fireEvent.mouseDown(target)
			fireEvent.mouseMove(document)
			fireEvent.keyDown(document, { key: 'A', code: 'A' })
			fireEvent.keyDown(document, { key: 'Escape', code: 'Esc' })

			expect(onDragCancelRepl).toHaveBeenCalled()
		})

		it('Sets custom class to dragged element', async () => {
			action = useDropOutside(target, { ...options, dragClassName: 'gag' })

			fireEvent.mouseDown(target)
			fireEvent.mouseMove(document)

			expect(screen.getByRole('presentation')).toBeInTheDocument()
			expect(screen.getByRole('presentation')).toHaveStyle('background-color: black;')
		})

		it('Sets custom class to dragged element on update', async () => {
			action = useDropOutside(target, { ...options, dragClassName: 'gag' })
			action.update({ dragClassName: 'pol' })

			fireEvent.mouseDown(target)
			fireEvent.mouseMove(document)

			expect(screen.getByRole('presentation')).toBeInTheDocument()
			expect(screen.getByRole('presentation')).toHaveStyle('background-color: red;')
		})

		it('Sets unknown custom class to dragged element', async () => {
			action = useDropOutside(target, { ...options, dragClassName: 'sur' })

			fireEvent.mouseDown(target)
			fireEvent.mouseMove(document)

			expect(screen.getByRole('presentation')).toBeInTheDocument()
			expect(screen.getByRole('presentation')).not.toHaveStyle('background-color: black;')
			expect(screen.getByRole('presentation')).not.toHaveStyle('background-color: red;')
		})

		it('Sets drag image', async () => {
			const dragImage = createElement({ tag: 'img', attributes: { src: 'foo', alt: 'bar' } })
			action = useDropOutside(target, { ...options, dragImage, dragHandleCentered: true })

			fireEvent.mouseDown(target)
			fireEvent.mouseMove(document)

			expect(screen.getByAltText('bar')).toBeInTheDocument()
		})

		it('Sets drag image on update', async () => {
			const dragImage = createElement({ tag: 'img', attributes: { src: 'foo', alt: 'bar' } })
			const dragImageRepl = createElement({ tag: 'img', attributes: { src: 'bar', alt: 'foo' } })
			action = useDropOutside(target, { ...options, dragImage })
			action.update({ dragImage: dragImageRepl, dragHandleCentered: false })

			fireEvent.mouseDown(target)
			fireEvent.mouseMove(document)

			expect(screen.getByAltText('foo')).toBeInTheDocument()
		})

		it('Stores and clears instances in static class property', async () => {
			useDropOutside(target, options)
			useDropOutside(target, options)
			useDropOutside(target, options)

			expect(DragAndDrop.instances).toHaveLength(3)

			DragAndDrop.destroy()

			expect(DragAndDrop.instances).toHaveLength(0)
		})
	})
})
