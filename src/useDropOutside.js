import DragAndDrop from './DragAndDrop'

const useDropOutside = (
	node,
	{ areaSelector, dragImage, dragClassName, onDropOutside, onDropInside, onDragCancel }
) => {
	const instance = new DragAndDrop(
		node,
		areaSelector,
		dragImage,
		dragClassName,
		onDropOutside,
		onDropInside,
		onDragCancel
	)

	return {
		destroy: () => instance.destroy(),
	}
}

export default useDropOutside
