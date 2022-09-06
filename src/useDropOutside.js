import DragAndDrop from './DragAndDrop'

const useDropOutside = (
	node,
	{ areaSelector, dragImage, dragClassName, animate, animateOptions, onDropOutside, onDropInside, onDragCancel }
) => {
	const instance = new DragAndDrop(
		node,
		areaSelector,
		dragImage,
		dragClassName,
		animate,
		animateOptions,
		onDropOutside,
		onDropInside,
		onDragCancel
	)

	return {
		destroy: () => instance.destroy(),
	}
}

export default useDropOutside
