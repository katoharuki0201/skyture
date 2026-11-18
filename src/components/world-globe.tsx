import createGlobe from "cobe";
import {
	ChevronLeft,
	ChevronRight,
	Pause,
	Play,
	RotateCcw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { artworkImageUrl } from "../lib/artwork-image";
import {
	type WorldCity,
	type WorldDay,
	worldCities,
} from "../lib/world-artworks";

const initialPose = { phi: 2.3, theta: 0.22 };

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
	const mount = useRef<HTMLDivElement>(null);
	const canvas = useRef<HTMLCanvasElement>(null);
	const markers = useRef(new Map<string, HTMLElement>());
	const connectors = useRef(new Map<string, SVGLineElement>());
	const dots = useRef(new Map<string, SVGCircleElement>());
	const resumeAt = useRef(0);
	const [rotationStopped, setRotationStopped] = useState(false);
	const manualStop = useRef(false);
	const isPaused = useRef(paused);
	isPaused.current = paused;
	const pauseRotation = () => {
		resumeAt.current = performance.now() + 3000;
	};
	const [failed, setFailed] = useState(false);
	const pose = useRef({ ...initialPose });
	const drag = useRef<{
		id: number;
		x: number;
		y: number;
		phi: number;
		theta: number;
	} | null>(null);

	useEffect(() => {
		const element = mount.current;
		const surface = canvas.current;
		if (!element || !surface) return;
		if (!surface.getContext("webgl2") && !surface.getContext("webgl")) {
			setFailed(true);
			return;
		}
		const size = element.clientWidth;
		const globe = createGlobe(surface, {
			width: size,
			height: size,
			devicePixelRatio: Math.min(window.devicePixelRatio, 2),
			...pose.current,
			dark: 1,
			diffuse: 1.5,
			mapSamples: 18000,
			mapBrightness: 7,
			baseColor: [0.08, 0.19, 0.36],
			markerColor: [0.2, 0.55, 1],
			glowColor: [0.25, 0.55, 1],
			markerElevation: 0,
			markers: worldCities.map((city) => ({
				location: [city.latitude, city.longitude],
				size: 0.045,
			})),
		});
		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
		let frame = 0;
		let previous = performance.now();
		const positionMarkers = () => {
			const { phi, theta } = pose.current;
			const width = element.clientWidth;
			const points: {
				id: string;
				x: number;
				y: number;
				anchorX: number;
				anchorY: number;
			}[] = [];
			// Same projection as COBE's marker shader, with radius 0.8 and no elevation.
			for (const city of worldCities) {
				const marker = markers.current.get(city.id);
				const connector = connectors.current.get(city.id);
				const dot = dots.current.get(city.id);
				if (!marker) continue;
				const lat = (city.latitude * Math.PI) / 180;
				const lon = (city.longitude * Math.PI) / 180 - Math.PI;
				const x = -Math.cos(lat) * Math.cos(lon) * 0.8;
				const y = Math.sin(lat) * 0.8;
				const z = Math.cos(lat) * Math.sin(lon) * 0.8;
				const rx = Math.cos(phi) * x + Math.sin(phi) * z;
				const ry =
					Math.sin(phi) * Math.sin(theta) * x +
					Math.cos(theta) * y -
					Math.cos(phi) * Math.sin(theta) * z;
				const rz =
					-Math.sin(phi) * Math.cos(theta) * x +
					Math.sin(theta) * y +
					Math.cos(phi) * Math.cos(theta) * z;
				const visible = rz > 0.08;
				marker.style.visibility = visible ? "visible" : "hidden";
				if (connector)
					connector.style.visibility = visible ? "visible" : "hidden";
				if (dot) dot.style.visibility = visible ? "visible" : "hidden";
				if (visible) {
					const x = ((rx + 1) * width) / 2;
					const y = ((1 - ry) * width) / 2;
					points.push({ id: city.id, x, y: y - 64, anchorX: x, anchorY: y });
				}
			}
			for (let pass = 0; pass < 4; pass++) {
				for (let i = 0; i < points.length; i++)
					for (let j = i + 1; j < points.length; j++) {
						const a = points[i],
							b = points[j];
						const dx = b.x - a.x,
							dy = b.y - a.y;
						const distance = Math.hypot(dx, dy);
						if (distance >= 100) continue;
						const shift = (100 - distance) / 2;
						const nx = distance > 0.01 ? dx / distance : 1;
						const ny = distance > 0.01 ? dy / distance : 0;
						a.x -= nx * shift;
						a.y -= ny * shift;
						b.x += nx * shift;
						b.y += ny * shift;
					}
			}
			for (const point of points) {
				const marker = markers.current.get(point.id);
				if (!marker) continue;
				point.x = Math.max(44, Math.min(width - 44, point.x));
				point.y = Math.min(
					point.anchorY - 64,
					Math.max(24, Math.min(width - 54, point.y)),
				);
				marker.style.left = `${point.x}px`;
				marker.style.top = `${point.y}px`;
				const connector = connectors.current.get(point.id);
				connector?.setAttribute("x1", String(point.anchorX));
				connector?.setAttribute("y1", String(point.anchorY));
				connector?.setAttribute("x2", String(point.x));
				connector?.setAttribute(
					"y2",
					String(point.y + marker.offsetHeight / 2),
				);
				const dot = dots.current.get(point.id);
				dot?.setAttribute("cx", String(point.anchorX));
				dot?.setAttribute("cy", String(point.anchorY));
			}
		};
		const animate = (now: number) => {
			const delta = Math.min((now - previous) / 1000, 0.1);
			previous = now;
			if (isPaused.current) resumeAt.current = now + 3000;
			if (
				now >= resumeAt.current &&
				!drag.current &&
				!isPaused.current &&
				!manualStop.current &&
				!reduced.matches
			)
				pose.current.phi += delta * 0.1;
			globe.update(pose.current);
			positionMarkers();
			frame = requestAnimationFrame(animate);
		};
		frame = requestAnimationFrame(animate);
		const observer = new ResizeObserver(() => {
			const width = element.clientWidth;
			globe.update({ width, height: width });
			positionMarkers();
		});
		observer.observe(element);
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
			globe.destroy();
		};
	}, []);

	return (
		<div className="world-globe-area">
			<div
				className="world-globe"
				ref={mount}
				onPointerDownCapture={() => {
					resumeAt.current = Number.POSITIVE_INFINITY;
				}}
				onPointerUpCapture={pauseRotation}
				onPointerCancelCapture={pauseRotation}
			>
				<canvas
					ref={canvas}
					aria-label="ドラッグで回転できる世界の地球儀"
					role="img"
					onPointerDown={(event) => {
						if (!event.isPrimary) return;
						drag.current = {
							id: event.pointerId,
							x: event.clientX,
							y: event.clientY,
							...pose.current,
						};
						event.currentTarget.setPointerCapture(event.pointerId);
					}}
					onPointerMove={(event) => {
						const start = drag.current;
						if (!start || start.id !== event.pointerId) return;
						const sensitivity = 4 / event.currentTarget.clientWidth;
						pose.current.phi =
							start.phi + (event.clientX - start.x) * sensitivity;
						pose.current.theta = Math.max(
							-1.2,
							Math.min(
								1.2,
								start.theta + (event.clientY - start.y) * sensitivity,
							),
						);
					}}
					onPointerUp={() => {
						drag.current = null;
						pauseRotation();
					}}
					onPointerCancel={() => {
						drag.current = null;
						pauseRotation();
					}}
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
									onFocus={pauseRotation}
									onClick={() => {
										pauseRotation();
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
				<>
					<div className="transparent-glass world-globe-controls">
						<button
							type="button"
							aria-label="左へ回す"
							onClick={() => {
								pauseRotation();
								pose.current.phi -= 0.4;
							}}
						>
							<ChevronLeft size={20} aria-hidden="true" />
						</button>
						<button
							type="button"
							aria-label={rotationStopped ? "自動回転を再開" : "自動回転を停止"}
							aria-pressed={rotationStopped}
							onClick={() => {
								manualStop.current = !manualStop.current;
								setRotationStopped(manualStop.current);
								if (!manualStop.current) resumeAt.current = 0;
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
							onClick={() => {
								pauseRotation();
								pose.current.phi += 0.4;
							}}
						>
							<ChevronRight size={20} aria-hidden="true" />
						</button>
						<button
							type="button"
							aria-label="元の位置に戻す"
							title="元の位置に戻す"
							onClick={() => {
								drag.current = null;
								pose.current = { ...initialPose };
								pauseRotation();
							}}
						>
							<RotateCcw size={18} aria-hidden="true" />
						</button>
					</div>
				</>
			)}
		</div>
	);
}
