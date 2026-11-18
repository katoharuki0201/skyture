import { CloudSun } from "lucide-react";
import { useEffect, useRef } from "react";

export type GenerationStage = "location" | "weather" | "artwork";
const stages = {
	location: "現在地を取得しています",
	weather: "今の空を確認しています",
	artwork: "今日の一枚を準備しています",
};

export function GenerationIndicator({
	stage,
	compact = false,
}: {
	stage: GenerationStage;
	compact?: boolean;
}) {
	return (
		<output
			className={`generation-indicator${compact ? " is-compact" : ""}`}
			aria-label={stages[stage]}
		>
			<span className="generation-orbit" aria-hidden="true">
				<span className="generation-orbit-ring" />
				<CloudSun size={compact ? 14 : 34} strokeWidth={1.3} />
			</span>
		</output>
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
