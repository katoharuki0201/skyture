import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { type City, cities } from "../data/cities";
import { useDialogBackdrop } from "../lib/use-dialog-backdrop";

export function CityPicker({
	onSelect,
	onClose,
}: {
	onSelect: (city: City) => void;
	onClose: () => void;
}) {
	const dialog = useRef<HTMLDialogElement>(null);
	const backdrop = useDialogBackdrop();
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
			{...backdrop}
			ref={dialog}
			className="transparent-glass city-picker"
			aria-labelledby="city-picker-title"
			onClose={onClose}
		>
			<button
				className="city-picker-close"
				type="button"
				aria-label="都市選択を閉じる"
				onClick={() => dialog.current?.close()}
			>
				<X size={22} aria-hidden="true" />
			</button>
			<h2 id="city-picker-title">都市を選ぶ</h2>
			<div className="city-picker-list">
				{cities.map((city) => (
					<button type="button" key={city.id} onClick={() => onSelect(city)}>
						{city.name}
					</button>
				))}
			</div>
		</dialog>
	);
}
