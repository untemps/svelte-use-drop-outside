import { createElement } from '@untemps/utils/dom/createElement'

import { doElementsOverlap } from '../doElementsOverlap'

const create = (
	{ width = 100, height = 100, left = 10, top = 10 } = { width: 100, height: 100, left: 10, top: 10 }
) => {
	const el = createElement({
		attributes: {
			style: `width: ${width}px; height: ${height}px; position: absolute; left: ${left}px; top: ${top}px;`,
		},
		parent: document.body,
	})
	el.getBoundingClientRect = () => ({
		width,
		height,
		top,
		left,
		right: left + width,
		bottom: top + height,
	})
	return el
}

describe('doElementsOverlap', () => {
	it.each([
		[create(), create(), true],
		[create(), create({ left: 130 }), false],
		[create(), create({ top: 130 }), false],
		[create({ width: 140 }), create({ left: 130 }), true],
		[create({ height: 140 }), create({ top: 130 }), true],
		[create({ width: 140, height: 140 }), create({ left: 130, top: 130 }), true],
		[create({ width: 140, height: 140, left: 250, top: 250 }), create({ left: 130, top: 130 }), false],
	])('returns overlap status', async (element1, element2, expected) => {
		expect(doElementsOverlap(element1, element2)).toBe(expected)
	})
})
