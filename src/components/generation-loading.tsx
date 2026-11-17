import { CloudSun, Image, MapPin } from "lucide-react";
import { useEffect, useRef } from "react";

export type GenerationStage = "location" | "weather" | "artwork";
const stages = {
	location: { icon: MapPin, label: "現在地を取得しています", index: 0 },
	weather: { icon: CloudSun, label: "今の空を確認しています", index: 1 },
	artwork: { icon: Image, label: "今日の一枚を準備しています", index: 2 },
};

export function GenerationIndicator({ stage }: { stage: GenerationStage }) {
	const { icon: Icon, label, index } = stages[stage];
	return (
		<div className="generation-indicator">
			<div className="generation-orbit" aria-hidden="true">
				<span className="generation-orbit-ring" />
				<Icon size={34} strokeWidth={1.3} />
			</div>
			<p className="generation-loading-title">空から、一枚の絵画へ。</p>
			<output className="generation-loading-status" aria-live="polite">
				{label}
				<span className="generation-loading-dots" aria-hidden="true">
					…
				</span>
			</output>
			<div className="generation-steps" aria-hidden="true">
				{[0, 1, 2].map((step) => (
					<span
						key={step}
						className={
							step < index ? "is-complete" : step === index ? "is-current" : ""
						}
					/>
				))}
			</div>
		</div>
	);
}

export function GenerationLoading({ stage }: { stage: GenerationStage }) {
	const dialog = useRef<HTMLDialogElement>(null);
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
			ref={dialog}
			className="generation-loading-dialog"
			aria-label="絵画を準備しています"
			onCancel={(event) => event.preventDefault()}
		>
			<GenerationIndicator stage={stage} />
		</dialog>
	);
}
