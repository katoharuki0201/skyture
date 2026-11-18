import createGlobe, { type Globe } from "cobe";
import { cities } from "../data/cities";
import { globeLayout, initialGlobePose } from "./globe-layout";

export type GlobeElements = {
	markers: Map<string, HTMLElement>;
	connectors: Map<string, SVGLineElement>;
	dots: Map<string, SVGCircleElement>;
};
export class GlobeScene {
	private globe: Globe;
	private pose = { ...initialGlobePose };
	private width = 0;
	private frame = 0;
	private timer = 0;
	private previous = 0;
	private resumeAt = 0;
	private stopped = false;
	private holding = false;
	private paused = false;
	private dirty = true;
	private disposed = false;
	private drag: { x: number; y: number; phi: number; theta: number } | null =
		null;
	private motion = matchMedia("(prefers-reduced-motion: reduce)");
	private observer: ResizeObserver;
	private cardObserver: ResizeObserver;
	private heights = new Map<string, number>();
	constructor(
		root: HTMLElement,
		canvas: HTMLCanvasElement,
		private elements: GlobeElements,
	) {
		if (!canvas.getContext("webgl2") && !canvas.getContext("webgl"))
			throw new Error("WebGL unavailable");
		this.width = root.clientWidth;
		this.globe = createGlobe(canvas, {
			width: this.width,
			height: this.width,
			devicePixelRatio: Math.min(devicePixelRatio, 2),
			...this.pose,
			dark: 1,
			diffuse: 1.5,
			mapSamples: 18000,
			mapBrightness: 7,
			baseColor: [0.08, 0.19, 0.36],
			markerColor: [0.2, 0.55, 1],
			glowColor: [0.25, 0.55, 1],
			markerElevation: 0,
			markers: cities.map((city) => ({
				location: [city.latitude, city.longitude],
				size: 0.045,
			})),
		});
		this.observer = new ResizeObserver(([entry]) => {
			const width = entry.contentRect.width;
			if (!width || this.disposed) return;
			this.width = width;
			this.globe.update({ width, height: width });
			this.invalidate();
		});
		this.observer.observe(root);
		this.cardObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const id = (entry.target as HTMLElement).dataset.city;
				if (id)
					this.heights.set(
						id,
						entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height + 14,
					);
			}
			this.invalidate();
		});
		for (const marker of elements.markers.values())
			this.cardObserver.observe(marker);
		this.motion.addEventListener("change", this.wake);
		document.addEventListener("visibilitychange", this.wake);
		this.invalidate();
	}
	private eligible() {
		return (
			!this.stopped &&
			!this.paused &&
			!this.holding &&
			!this.drag &&
			!this.motion.matches &&
			!document.hidden
		);
	}
	private wake = () => {
		clearTimeout(this.timer);
		this.timer = 0;
		if (this.disposed) return;
		if (document.hidden) {
			cancelAnimationFrame(this.frame);
			this.frame = 0;
			return;
		}
		if (this.dirty || (this.eligible() && performance.now() >= this.resumeAt)) {
			if (!this.frame) {
				this.previous = performance.now();
				this.frame = requestAnimationFrame(this.render);
			}
		} else if (this.eligible() && Number.isFinite(this.resumeAt)) {
			this.timer = window.setTimeout(
				this.wake,
				Math.max(0, this.resumeAt - performance.now()),
			);
		}
	};
	private invalidate = () => {
		this.dirty = true;
		this.wake();
	};
	private layout() {
		const points = globeLayout(this.pose, this.width),
			visible = new Set(points.map((point) => point.id));
		for (const city of cities) {
			const visibility = visible.has(city.id) ? "visible" : "hidden";
			const marker = this.elements.markers.get(city.id),
				connector = this.elements.connectors.get(city.id),
				dot = this.elements.dots.get(city.id);
			if (marker) marker.style.visibility = visibility;
			if (connector) connector.style.visibility = visibility;
			if (dot) dot.style.visibility = visibility;
		}
		for (const point of points) {
			const marker = this.elements.markers.get(point.id);
			if (marker) {
				marker.style.left = `${point.x}px`;
				marker.style.top = `${point.y}px`;
			}
			const connector = this.elements.connectors.get(point.id);
			connector?.setAttribute("x1", String(point.anchorX));
			connector?.setAttribute("y1", String(point.anchorY));
			connector?.setAttribute("x2", String(point.x));
			connector?.setAttribute(
				"y2",
				String(point.y + (this.heights.get(point.id) ?? 96) / 2),
			);
			const dot = this.elements.dots.get(point.id);
			dot?.setAttribute("cx", String(point.anchorX));
			dot?.setAttribute("cy", String(point.anchorY));
		}
	}
	private render = (now: number) => {
		this.frame = 0;
		if (this.disposed || document.hidden) return;
		const animate = this.eligible() && now >= this.resumeAt;
		if (animate)
			this.pose.phi += Math.min((now - this.previous) / 1000, 0.1) * 0.1;
		this.previous = now;
		if (this.dirty || animate) {
			this.globe.update(this.pose);
			this.layout();
			this.dirty = false;
		}
		if (animate) this.frame = requestAnimationFrame(this.render);
		else this.wake();
	};
	hold() {
		this.holding = true;
		this.resumeAt = Number.POSITIVE_INFINITY;
		this.wake();
	}
	delayRotation() {
		this.resumeAt = performance.now() + 3000;
		this.wake();
	}
	release() {
		this.holding = false;
		this.drag = null;
		this.resumeAt = performance.now() + 3000;
		this.wake();
	}
	beginDrag(x: number, y: number) {
		this.drag = { x, y, ...this.pose };
		this.hold();
	}
	moveDrag(x: number, y: number) {
		if (!this.drag) return;
		const sensitivity = 4 / this.width;
		this.pose.phi = this.drag.phi + (x - this.drag.x) * sensitivity;
		this.pose.theta = Math.max(
			-1.2,
			Math.min(1.2, this.drag.theta + (y - this.drag.y) * sensitivity),
		);
		this.invalidate();
	}
	turn(delta: number) {
		this.pose.phi += delta;
		this.release();
		this.invalidate();
	}
	reset() {
		this.pose = { ...initialGlobePose };
		this.release();
		this.invalidate();
	}
	setStopped(stopped: boolean) {
		this.stopped = stopped;
		if (!stopped) this.resumeAt = 0;
		this.wake();
	}
	setPaused(paused: boolean) {
		if (this.paused === paused) return;
		this.paused = paused;
		if (!paused) this.resumeAt = performance.now() + 3000;
		this.wake();
	}
	dispose() {
		this.disposed = true;
		cancelAnimationFrame(this.frame);
		clearTimeout(this.timer);
		this.observer.disconnect();
		this.cardObserver.disconnect();
		this.motion.removeEventListener("change", this.wake);
		document.removeEventListener("visibilitychange", this.wake);
		this.globe.destroy();
	}
}
