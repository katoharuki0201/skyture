import {
	ChevronLeft,
	ChevronRight,
	Pause,
	Play,
	RotateCcw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { artworkImageUrl } from "../lib/artwork-image";
import { GlobeScene } from "../lib/globe-scene";
import {
	type WorldCity,
	type WorldDay,
	worldCities,
} from "../lib/world-artworks";

export function WorldGlobe({
	snapshot,
	loading,
	onSelect,
	paused,
}: {
	snapshot: WorldDay | null;
	loading: boolean;
	onSelect: (city: WorldCity) => void;
	paused: boolean;
}) {
	const mount = useRef<HTMLDivElement>(null),
		canvas = useRef<HTMLCanvasElement>(null);
	const markers = useRef(new Map<string, HTMLElement>()),
		connectors = useRef(new Map<string, SVGLineElement>()),
		dots = useRef(new Map<string, SVGCircleElement>());
	const scene = useRef<GlobeScene | null>(null);
	const [failed, setFailed] = useState(false),
		[rotationStopped, setRotationStopped] = useState(false);
	useEffect(() => {
		if (!mount.current || !canvas.current) return;
		try {
			scene.current = new GlobeScene(mount.current, canvas.current, {
				markers: markers.current,
				connectors: connectors.current,
				dots: dots.current,
			});
		} catch {
			setFailed(true);
		}
		return () => {
			scene.current?.dispose();
			scene.current = null;
		};
	}, []);
	useEffect(() => {
		scene.current?.setPaused(paused);
	}, [paused]);
	return (
		<div className="world-globe-area">
			<div
				className="world-globe"
				ref={mount}
				onPointerDownCapture={(event) => {
					if (event.isPrimary) scene.current?.hold();
				}}
				onPointerUpCapture={(event) => {
					if (event.isPrimary) scene.current?.release();
				}}
				onPointerCancelCapture={(event) => {
					if (event.isPrimary) scene.current?.release();
				}}
			>
				<canvas
					ref={canvas}
					role="img"
					aria-label="ドラッグで回転できる世界の地球儀"
					onPointerDown={(event) => {
						if (!event.isPrimary) return;
						scene.current?.beginDrag(event.clientX, event.clientY);
						event.currentTarget.setPointerCapture(event.pointerId);
					}}
					onPointerMove={(event) => {
						if (event.isPrimary)
							scene.current?.moveDrag(event.clientX, event.clientY);
					}}
					onLostPointerCapture={() => scene.current?.release()}
				/>
				<svg className="world-city-connectors" aria-hidden="true">
					{worldCities.map((city) => (
						<circle
							key={city.id}
							r={3.5}
							ref={(element) => {
								if (element) dots.current.set(city.id, element);
								else dots.current.delete(city.id);
							}}
						/>
					))}
					{worldCities.map((city) => (
						<line
							key={city.id}
							ref={(element) => {
								if (element) connectors.current.set(city.id, element);
								else connectors.current.delete(city.id);
							}}
						/>
					))}
				</svg>
				{!failed &&
					worldCities.map((city) => (
						<figure
							key={city.id}
							className="world-city-artwork"
							data-city={city.id}
							ref={(element) => {
								if (element) markers.current.set(city.id, element);
								else markers.current.delete(city.id);
							}}
						>
							{snapshot?.records[city.id] ? (
								<button
									type="button"
									className="world-artwork-open"
									aria-label={`${city.name}の作品と情報をみる`}
									onFocus={() => scene.current?.delayRotation()}
									onClick={() => {
										scene.current?.delayRotation();
										onSelect(city);
									}}
								>
									<img
										src={artworkImageUrl(snapshot.records[city.id].artwork)}
										alt={`${snapshot.records[city.id].artwork.title} — ${snapshot.records[city.id].artwork.artist}`}
										draggable={false}
									/>
								</button>
							) : (
								<span className="world-artwork-placeholder">
									{(snapshot ? snapshot.loading.includes(city.id) : loading)
										? "取得中…"
										: "取得できません"}
								</span>
							)}
							<figcaption>{city.name}</figcaption>
						</figure>
					))}
			</div>
			{failed ? (
				<p role="alert">この端末では地球儀の3D表示を利用できません。</p>
			) : (
				<div className="transparent-glass world-globe-controls">
					<button
						type="button"
						aria-label="左へ回す"
						onClick={() => scene.current?.turn(-0.4)}
					>
						<ChevronLeft size={20} aria-hidden="true" />
					</button>
					<button
						type="button"
						aria-label={rotationStopped ? "自動回転を再開" : "自動回転を停止"}
						aria-pressed={rotationStopped}
						onClick={() => {
							const stopped = !rotationStopped;
							scene.current?.setStopped(stopped);
							setRotationStopped(stopped);
						}}
					>
						{rotationStopped ? (
							<Play size={18} aria-hidden="true" />
						) : (
							<Pause size={18} aria-hidden="true" />
						)}
					</button>
					<button
						type="button"
						aria-label="右へ回す"
						onClick={() => scene.current?.turn(0.4)}
					>
						<ChevronRight size={20} aria-hidden="true" />
					</button>
					<button
						type="button"
						aria-label="元の位置に戻す"
						title="元の位置に戻す"
						onClick={() => scene.current?.reset()}
					>
						<RotateCcw size={18} aria-hidden="true" />
					</button>
				</div>
			)}
		</div>
	);
}
