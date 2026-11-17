import { type MouseEvent, type PointerEvent, useRef } from "react";

function outside(element: HTMLDialogElement, x: number, y: number): boolean {
	const rect = element.getBoundingClientRect();
	return x < rect.left || x > rect.right || y < rect.top || y > rect.bottom;
}

export function useDialogBackdrop() {
	const startedOutside = useRef(false);
	return {
		onPointerDown(event: PointerEvent<HTMLDialogElement>) {
			startedOutside.current =
				event.target === event.currentTarget &&
				outside(event.currentTarget, event.clientX, event.clientY);
		},
		onClick(event: MouseEvent<HTMLDialogElement>) {
			if (
				startedOutside.current &&
				event.target === event.currentTarget &&
				outside(event.currentTarget, event.clientX, event.clientY)
			)
				event.currentTarget.close();
			startedOutside.current = false;
		},
	};
}
