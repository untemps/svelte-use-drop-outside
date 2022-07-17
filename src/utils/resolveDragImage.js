import { isString } from '@untemps/utils/string/isString'

export const resolveDragImage = (image) => {
	if (!!image) {
		let source = image?.source || image
		if (isString(image) || isString(image?.source)) {
			source = new Image()
			source.src = image?.source || image
		}
		return {
			imgElement: source,
			xOffset: image?.xOffset || 0,
			yOffset: image?.yOffset || 0,
		}
	}
	return null
}
