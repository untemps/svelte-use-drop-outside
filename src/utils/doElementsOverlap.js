export const doElementsOverlap = (element1, element2) => {
	const { left: left1, right: right1, top: top1, bottom: bottom1 } = element1.getBoundingClientRect()
	const { left: left2, right: right2, top: top2, bottom: bottom2 } = element2.getBoundingClientRect()

	return !(top1 > bottom2 || right1 < left2 || bottom1 < top2 || left1 > right2)
}
