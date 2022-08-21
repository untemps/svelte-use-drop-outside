export const getCSSDeclaration = (className, returnText = false) => {
	className = className.startsWith('.') ? className : `.${className}`
	if (!!document.styleSheets?.length) {
		for (let { cssRules } of document.styleSheets) {
			if (!!cssRules?.length) {
				for (let { selectorText, style } of cssRules) {
					if (selectorText === className && !!style) {
						return returnText ? style.cssText : style
					}
				}
			}
		}
	}

	return null
}
