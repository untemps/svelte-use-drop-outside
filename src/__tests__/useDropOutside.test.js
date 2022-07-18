/**
 * @jest-environment jsdom
 */

import { createElement } from '@untemps/utils/dom/createElement'

import useDropOutside from '../useDropOutside'

const initTarget = (id) => {
	return createElement({ tag: 'div', attributes: { id, class: 'bar' }, parent: document.body })
}

describe('useDropOutside', () => {
	let target,
		options = null

	beforeEach(() => {
		target = initTarget('target')
		options = {}
	})

	afterEach(() => {
		target = null
		options = null
	})

	describe('init', () => {
		it('Sets draggable attribute on target', async () => {
			useDropOutside(target, options)
			expect(target.draggable).toBeTruthy()
		})
	})
})
