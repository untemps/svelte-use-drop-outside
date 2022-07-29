import { createElement } from '@untemps/utils/dom/createElement'

import { resolveDragImage } from '../resolveDragImage'

describe('resolveDragImage', () => {
	let img = createElement()

	it.each([null, undefined, 0, {}])('returns null', (source) => {
		expect(resolveDragImage(source)).toBeNull()
	})

	it('returns same element', () => {
		expect(resolveDragImage(img).isSameNode(img)).toBeTruthy()
	})

	it.each([
		[{ src: 'foo' }, createElement({ tag: 'img', attributes: { src: 'foo' } })],
		[
			{ src: 'foo', width: 100, height: 100 },
			createElement({ tag: 'img', attributes: { src: 'foo', width: 100, height: 100 } }),
		],
		['foo', createElement({ tag: 'img', attributes: { src: 'foo' } })],
	])('returns proper element', (source, expected) => {
		expect(resolveDragImage(source).isEqualNode(expected)).toBeTruthy()
	})
})
