import DragAndDrop from './DragAndDrop'

const useDropOutside = (
	node,
	{ areaSelector, dragImage, dragClassName, onDropOutside, onDropInside, onDragCancel }
) => {
	const dragAndDrop = new DragAndDrop(
		node,
		areaSelector,
		dragImage,
		dragClassName,
		onDropOutside,
		onDropInside,
		onDragCancel
	)

	return {
		destroy: () => dragAndDrop.destroy(),
	}
}

export default useDropOutside
