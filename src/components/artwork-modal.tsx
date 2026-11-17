import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Selection } from "../lib/artwork-selection";
import { useDialogBackdrop } from "../lib/use-dialog-backdrop";
import { ArtworkPlate } from "./artwork-plate";
import { ArtworkViewer } from "./artwork-viewer";

export default function ArtworkModal({
	selection,
	onClose,
}: {
	selection: Selection;
	onClose: () => void;
}) {
	const dialog = useRef<HTMLDialogElement>(null);
	const backdropDismiss = useDialogBackdrop();
	useEffect(() => {
		const element = dialog.current;
		if (!element) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		element.showModal();
		return () => {
			element.close();
			document.body.style.overflow = previous;
		};
	}, []);
	return (
		<dialog
			{...backdropDismiss}
			ref={dialog}
			className="artwork-modal"
			aria-labelledby="artwork-modal-title"
			onClose={onClose}
		>
			<button
				type="button"
				className="artwork-modal-close"
				aria-label="作品を閉じる"
				onClick={() => dialog.current?.close()}
			>
				<X size={25} aria-hidden="true" />
			</button>
			<ArtworkViewer selection={selection} />
			<ArtworkPlate selection={selection} />
		</dialog>
	);
}
