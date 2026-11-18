import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Selection } from "../lib/artwork";
import type { ArtworkLocation } from "../lib/artwork-back";
import { useDialogBackdrop } from "../lib/use-dialog-backdrop";
import { ArtworkViewer } from "./artwork-viewer";
import { WeatherAttribution } from "./weather-attribution";

export default function ArtworkModal({
	selection,
	onClose,
	location,
}: {
	selection: Selection;
	onClose: () => void;
	location?: ArtworkLocation;
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
			aria-label={`${location ? `${location.name}の` : ""}作品：${selection.artwork.title}`}
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
			<ArtworkViewer
				key={selection.generatedAt}
				selection={selection}
				location={location}
				flippable
			/>
			<WeatherAttribution />
		</dialog>
	);
}
