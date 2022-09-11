import DragAndDrop from './DragAndDrop'

const useDropOutside = (
	node,
	{
		areaSelector,
		dragImage,
		dragClassName,
		animate,
		animateOptions,
		dragHandleCentered,
		onDropOutside,
		onDropInside,
		onDragCancel,
	}
) => {
	const instance = new DragAndDrop(
		node,
		areaSelector,
		dragImage,
		dragClassName,
		animate,
		animateOptions,
		dragHandleCentered,
		onDropOutside,
		onDropInside,
		onDragCancel
	)

	return {
		update: ({
			areaSelector,
			dragImage,
			dragClassName,
			animate,
			animateOptions,
			dragHandleCentered,
			onDropOutside,
			onDropInside,
			onDragCancel,
		}) =>
			instance.update(
				areaSelector,
				dragImage,
				dragClassName,
				animate,
				animateOptions,
				dragHandleCentered,
				onDropOutside,
				onDropInside,
				onDragCancel
			),
		destroy: () => instance.destroy(),
	}
}

export default useDropOutside
