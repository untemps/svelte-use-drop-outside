/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from '@testing-library/dom'

import { createElement } from '@untemps/utils/dom/createElement'

import useDropOutside from '../useDropOutside'

const initArea = (id) => {
	return createElement({
		tag: 'div',
		attributes: { id, class: 'foo', style: { width: 200, height: 200 } },
		parent: document.body,
	})
}

const initTarget = (id, parent) => {
	return createElement({ tag: 'div', attributes: { id, class: 'bar', style: { width: 100, height: 100 } }, parent })
}

describe('useDropOutside', () => {
	let area,
		target,
		options = null

	beforeEach(() => {
		area = initArea('area')
		target = initTarget('target', area)
		options = {
			areaSelector: '#area',
		}
	})

	afterEach(() => {
		area = null
		target = null
		options = null
	})

	describe('init', () => {
		it('Sets draggable attribute on target', async () => {
			useDropOutside(target, options)
			fireEvent.mouseOver(target)
			await (() => expect(target.style.pointer).toBe('grab'))
		})
	})
})
