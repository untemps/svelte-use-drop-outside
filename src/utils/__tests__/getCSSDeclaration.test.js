/**
 * @jest-environment jsdom
 */

import { createElement } from '@untemps/utils/dom/createElement'

import { getCSSDeclaration } from '../getCSSDeclaration'

describe('getCSSDeclaration', () => {
	let el = null

	describe('With no stylesheets', () => {
		it('Returns null', () => {
			expect(getCSSDeclaration('drag')).toBeNull()
		})
	})

	describe('With stylesheets', () => {
		beforeAll(() => {
			createElement({
				tag: 'style',
				textContent: `.drag {
        background-color: black;
      }`,
				parent: document.body,
			})

			el = createElement({
				attributes: {
					class: 'drag',
				},
				parent: document.body,
			})
		})

		it.each([null, undefined, '', 'drop', '.drop'])('Returns null', (className) => {
			expect(getCSSDeclaration(className)).toBeNull()
		})

		it.each(['drag', '.drag'])('Returns declaration', (className) => {
			expect(getCSSDeclaration(className)).toHaveLength(1)
		})

		it('Returns declaration', () => {
			expect(getCSSDeclaration('drag', true)).toBe('background-color: black;')
		})
	})
})
