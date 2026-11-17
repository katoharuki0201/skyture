import {
	Alignment,
	EventType,
	Fit,
	Layout,
	RuntimeLoader,
	useRive,
} from "@rive-app/react-webgl2";
import wasmUrl from "@rive-app/webgl2/rive.wasm?url";
import { useEffect } from "react";

RuntimeLoader.setWasmUrl(wasmUrl);

const layout = new Layout({ fit: Fit.Cover, alignment: Alignment.Center });

export function AnimatedBackground() {
	const { rive, RiveComponent } = useRive({
		src: `${import.meta.env.BASE_URL}rive/background.riv`,
		autoplay: true,
		layout,
		shouldDisableRiveListeners: true,
	});

	useEffect(() => {
		if (!rive) return;

		// Repeat even when the exported timeline uses one-shot playback.
		const replay = () => rive.play();
		rive.on(EventType.Stop, replay);
		return () => rive.off(EventType.Stop, replay);
	}, [rive]);

	return (
		<div className="animated-background" aria-hidden="true">
			<RiveComponent />
		</div>
	);
}
