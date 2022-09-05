/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from '@testing-library/dom'

import { createElement } from '@untemps/utils/dom/createElement'
import { getElement } from '@untemps/utils/dom/getElement'
import { standby } from '@untemps/utils/async/standby'

import DragAndDrop from '../DragAndDrop'
import useDropOutside from '../useDropOutside'

const areaSize = 200
const targetSize = 100

const createStyle = () => {
	createElement({
		tag: 'style',
		textContent: `.gag {
        background-color: black;
      }`,
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

	const onDropInside = jest.fn()
	const onDropOutside = jest.fn()
	const onDragCancel = jest.fn()

	let useReturn = null

	beforeEach(() => {
		createStyle()
		area = createArea('area')
		target = createTarget('target', area)
		options = {
			areaSelector: '#area',
			onDropInside,
			onDropOutside,
			onDragCancel,
		}
	})

	afterEach(() => {
		area = null
		target = null
		options = null

		fireEvent.mouseUp(document)

		document.body.innerHTML = ''

		useReturn?.destroy()

		DragAndDrop.destroy()
	})

	describe('init', () => {
		it('Sets pointer to grab on mouseover', async () => {
			useReturn = useDropOutside(target, options)
			fireEvent.mouseOver(target)
			expect(target.style.cursor).toBe('grab')
		})

		it('Sets pointer to default on mouseout', async () => {
			useReturn = useDropOutside(target, options)
			fireEvent.mouseOver(target)
			fireEvent.mouseOut(target)
			expect(target.style.cursor).toBe('default')
		})

		it('Sets pointer to grabbing on mousedown', async () => {
			useReturn = useDropOutside(target, options)
			fireEvent.mouseDown(target)
			fireEvent.mouseMove(document)
			const drag = getElement('#drag')
			expect(drag.style.cursor).toBe('grabbing')
		})

		it('Removes dragged element on mouseup', async () => {
			useReturn = useDropOutside(target, options)
			fireEvent.mouseDown(target)
			fireEvent.mouseMove(document)
			const drag = getElement('#drag')
			expect(drag).toBeInTheDocument()
			fireEvent.mouseUp(document)
			expect(drag).not.toBeInTheDocument()
		})

		it('Triggers onDropInside callback', async () => {
			useReturn = useDropOutside(target, options)
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
			await standby()
			expect(onDropInside).toHaveBeenCalled()
		})

		it('Triggers onDropOutside callback', async () => {
			useReturn = useDropOutside(target, options)
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
			await standby()
			expect(onDropOutside).toHaveBeenCalled()
		})

		it('Triggers onDragCancel callback', async () => {
			useReturn = useDropOutside(target, options)
			fireEvent.mouseDown(target)
			fireEvent.mouseMove(document)
			fireEvent.keyDown(document, { key: 'A', code: 'A' })
			fireEvent.keyDown(document, { key: 'Escape', code: 'Esc' })
			await standby()
			expect(onDragCancel).toHaveBeenCalled()
		})

		it('Sets custom class to dragged element', async () => {
			useReturn = useDropOutside(target, { ...options, dragClassName: 'gag' })
			fireEvent.mouseDown(target)
			fireEvent.mouseMove(document)
			screen.debug()
			expect(screen.getByRole('presentation')).toBeInTheDocument()
			expect(screen.getByRole('presentation')).toHaveStyle('background-color: black;')
		})

		it('Sets unknown custom class to dragged element', async () => {
			useReturn = useDropOutside(target, { ...options, dragClassName: 'pol' })
			fireEvent.mouseDown(target)
			fireEvent.mouseMove(document)
			expect(screen.getByRole('presentation')).toBeInTheDocument()
			expect(screen.getByRole('presentation')).not.toHaveStyle('background-color: black;')
		})

		it('Sets drag image', async () => {
			const dragImage = createElement({ tag: 'img', attributes: { src: 'foo', alt: 'bar' } })
			useReturn = useDropOutside(target, { ...options, dragImage })
			fireEvent.mouseDown(target)
			fireEvent.mouseMove(document)
			expect(screen.getByAltText('bar')).toBeInTheDocument()
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
