import { isString } from '@untemps/utils/string/isString'
import { isElement } from '@untemps/utils/dom/isElement'

export const resolveDragImage = (source) => {
	if (!!source) {
		if (isElement(source)) {
			return source
		} else if (source.src || isString(source)) {
			const image = new Image()
			image.src = source.src || source
			source.width && (image.width = source.width)
			source.height && (image.height = source.height)
			return image
		}
	}
	return null
}
