import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ArtworkLocation, Selection } from "../lib/artwork";
import { artworkInformation } from "../lib/artwork-information";
import { ArtworkScene, type ArtworkSceneState } from "../lib/artwork-scene";
import { GenerationIndicator } from "./generation-loading";

export function ArtworkViewer({
	selection,
	location,
}: {
	selection: Selection;
	location?: ArtworkLocation;
}) {
	const container = useRef<HTMLButtonElement>(null);
	const scene = useRef<ArtworkScene | null>(null);
	const [state, setState] = useState<ArtworkSceneState>({
		loading: true,
		error: "",
	});
	const [backVisible, setBackVisible] = useState(false);
	const description = useId();
	const info = useMemo(
		() => artworkInformation(selection, location ?? selection.location),
		[selection, location],
	);
	useEffect(() => {
		if (!container.current) return;
		try {
			scene.current = new ArtworkScene(container.current, setState);
		} catch {
			setState({
				loading: false,
				error: "この端末では3D表示を利用できません。",
			});
		}
		return () => {
			scene.current?.dispose();
			scene.current = null;
		};
	}, []);
	useEffect(() => {
		setBackVisible(false);
		void scene.current?.setSelection(selection, info);
	}, [selection, info]);
	return (
		<div className={`artwork-viewer${state.loading ? " is-loading" : ""}`}>
			<button
				ref={container}
				type="button"
				className="artwork-model-stage"
				disabled={state.loading || !!state.error}
				aria-label={`${selection.artwork.title}。${backVisible ? "タップで絵画にもどる" : "タップで作品情報をみる"}`}
				aria-pressed={backVisible}
				aria-describedby={backVisible ? description : undefined}
				aria-busy={state.loading}
				onClick={() => {
					if (scene.current) setBackVisible(scene.current.flip());
				}}
			/>
			<p className="gallery-flip-hint">
				{backVisible
					? "- タップして絵画にもどる -"
					: "- タップして作品情報をみる -"}
			</p>
			<div
				id={description}
				className="sr-only"
				hidden={!backVisible}
				aria-live="polite"
			>
				<p>
					{info.title}。{info.artist}。{info.date}。
				</p>
				<dl>
					{info.fields.map((field) => (
						<div key={field.label}>
							<dt>{field.label}</dt>
							<dd>{field.value}</dd>
						</div>
					))}
				</dl>
			</div>
			{state.loading && (
				<div className="artwork-preparing-overlay">
					<GenerationIndicator stage="artwork" />
				</div>
			)}
			{state.error && (
				<div className="artwork-modal-error" role="alert">
					<p>{state.error}</p>
					<button
						type="button"
						onClick={() => {
							if (!scene.current && container.current) {
								try {
									scene.current = new ArtworkScene(container.current, setState);
								} catch {
									return;
								}
							}
							setBackVisible(false);
							void scene.current?.setSelection(selection, info);
						}}
					>
						再読み込み
					</button>
				</div>
			)}
		</div>
	);
}
