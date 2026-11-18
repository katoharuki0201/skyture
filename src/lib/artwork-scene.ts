import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { Selection } from "./artwork";
import { artworkBack } from "./artwork-back";
import { artworkImageUrl } from "./artwork-image";
import type { ArtworkInformation } from "./artwork-information";

export type ArtworkSceneState = { loading: boolean; error: string };
function abortable<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
	return new Promise((resolve, reject) => {
		const abort = () => reject(new DOMException("Aborted", "AbortError"));
		if (signal.aborted) {
			abort();
		} else signal.addEventListener("abort", abort, { once: true });
		operation
			.then(resolve, reject)
			.finally(() => signal.removeEventListener("abort", abort));
	});
}
function disposeMaterial(material: THREE.Material) {
	for (const value of Object.values(material))
		if (value instanceof THREE.Texture) value.dispose();
	material.dispose();
}
function disposeModel(model: THREE.Object3D) {
	model.traverse((object) => {
		if (object instanceof THREE.Mesh) {
			object.geometry.dispose();
			for (const material of Array.isArray(object.material)
				? object.material
				: [object.material])
				disposeMaterial(material);
		}
	});
}

// One scene/model per mounted viewer. Only the front/back textures change with selection.
export class ArtworkScene {
	private renderer: THREE.WebGLRenderer;
	private scene = new THREE.Scene();
	private display = new THREE.Group();
	private camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
	private observer: ResizeObserver;
	private lifetime = new AbortController();
	private request?: AbortController;
	private model?: THREE.Group;
	private picture?: THREE.Mesh;
	private bounds?: THREE.Box3;
	private modelPromise?: Promise<void>;
	private front?: THREE.CanvasTexture;
	private back?: ReturnType<typeof artworkBack>;
	private frame = 0;
	private lastTime = 0;
	private turns = 0;
	private revision = 0;
	private disposed = false;
	private motion = window.matchMedia("(prefers-reduced-motion: reduce)");
	constructor(
		private element: HTMLElement,
		private onState: (state: ArtworkSceneState) => void,
	) {
		this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
		this.renderer.outputColorSpace = THREE.SRGBColorSpace;
		this.renderer.domElement.setAttribute("aria-hidden", "true");
		element.appendChild(this.renderer.domElement);
		this.display.visible = false;
		this.scene.add(this.display);
		this.scene.add(new THREE.HemisphereLight(0xffffff, 0x6e7785, 1.1));
		const key = new THREE.DirectionalLight(0xfff7e8, 2);
		key.position.set(-3, 4, 5);
		this.scene.add(key);
		const fill = new THREE.DirectionalLight(0xdceaff, 0.7);
		fill.position.set(3, -1, 3);
		this.scene.add(fill);
		this.observer = new ResizeObserver(this.resize);
		this.observer.observe(element);
		this.motion.addEventListener("change", this.invalidate);
		document.addEventListener("visibilitychange", this.visibility);
		this.resize();
	}
	private visibility = () => {
		if (document.hidden) {
			cancelAnimationFrame(this.frame);
			this.frame = 0;
		} else this.invalidate();
	};
	private resize = () => {
		if (this.disposed) return;
		const width = this.element.clientWidth,
			height = this.element.clientHeight;
		if (!width || !height) return;
		this.renderer.setSize(width, height);
		this.camera.aspect = width / height;
		const distance =
			1.6 /
			Math.tan(THREE.MathUtils.degToRad(17.5)) /
			Math.min(this.camera.aspect, 1);
		this.camera.position.set(0, 0, distance);
		this.camera.lookAt(0, 0, 0);
		this.camera.updateProjectionMatrix();
		this.invalidate();
	};
	private invalidate = () => {
		if (!this.frame && !this.disposed && !document.hidden) {
			this.lastTime = performance.now();
			this.frame = requestAnimationFrame(this.render);
		}
	};
	private render = (now: number) => {
		this.frame = 0;
		if (this.disposed || document.hidden) return;
		const target = this.turns * Math.PI;
		const elapsed = Math.min((now - this.lastTime) / 1000, 0.1);
		this.lastTime = now;
		const remaining = target - this.display.rotation.y;
		this.display.rotation.y =
			this.motion.matches || Math.abs(remaining) < 0.001
				? target
				: THREE.MathUtils.damp(this.display.rotation.y, target, 8, elapsed);
		this.renderer.render(this.scene, this.camera);
		if (this.display.rotation.y !== target)
			this.frame = requestAnimationFrame(this.render);
	};
	flip() {
		this.turns += 1;
		this.invalidate();
		return this.turns % 2 === 1;
	}
	private loadModel(): Promise<void> {
		if (this.modelPromise) return this.modelPromise;
		this.modelPromise = (async () => {
			const base = `${import.meta.env.BASE_URL}models/`;
			const controller = new AbortController();
			const abort = () => controller.abort();
			this.lifetime.signal.addEventListener("abort", abort, { once: true });
			const timeout = window.setTimeout(abort, 20_000);
			try {
				const response = await fetch(`${base}frame.glb`, {
					signal: controller.signal,
				});
				if (!response.ok) throw new Error("額縁モデルを読み込めませんでした。");
				const gltf = await new GLTFLoader().parseAsync(
					await response.arrayBuffer(),
					base,
				);
				if (this.disposed) {
					disposeModel(gltf.scene);
					return;
				}
				this.model = gltf.scene;
				const picture = this.model.getObjectByName("Picture");
				if (!(picture instanceof THREE.Mesh)) {
					disposeModel(this.model);
					this.model = undefined;
					throw new Error("モデル内に作品の表示面が見つかりませんでした。");
				}
				this.picture = picture;
				const bounds = new THREE.Box3().setFromObject(this.model),
					center = bounds.getCenter(new THREE.Vector3());
				const scale =
					3 /
					Math.max(bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y);
				this.model.position.copy(center).multiplyScalar(-scale);
				this.model.scale.setScalar(scale);
				this.display.add(this.model);
				this.bounds = new THREE.Box3().setFromObject(this.model);
			} finally {
				clearTimeout(timeout);
				this.lifetime.signal.removeEventListener("abort", abort);
			}
		})().catch((error) => {
			this.modelPromise = undefined;
			throw error;
		});
		return this.modelPromise;
	}
	async setSelection(selection: Selection, info: ArtworkInformation) {
		const revision = ++this.revision;
		this.request?.abort();
		const controller = new AbortController();
		this.request = controller;
		const timeout = window.setTimeout(() => controller.abort(), 20_000);
		this.turns = 0;
		this.display.rotation.y = 0;
		this.display.visible = false;
		this.invalidate();
		this.onState({ loading: true, error: "" });
		let texture: THREE.CanvasTexture | undefined;
		let nextBack: ReturnType<typeof artworkBack> | undefined;
		try {
			await this.loadModel();
			if (this.disposed || revision !== this.revision) return;
			await abortable(document.fonts.ready, controller.signal);
			if (controller.signal.aborted)
				throw new DOMException("Aborted", "AbortError");
			const response = await fetch(artworkImageUrl(selection.artwork), {
				signal: controller.signal,
			});
			if (!response.ok) throw new Error("作品画像を読み込めませんでした。");
			const url = URL.createObjectURL(await response.blob());
			const image = new Image();
			try {
				image.src = url;
				await abortable(image.decode(), controller.signal);
			} finally {
				URL.revokeObjectURL(url);
			}
			if (this.disposed || revision !== this.revision) return;
			if (controller.signal.aborted)
				throw new DOMException("Aborted", "AbortError");
			const canvas = document.createElement("canvas");
			canvas.width = canvas.height = 2048;
			const ctx = canvas.getContext("2d");
			if (!ctx) throw new Error("作品画像を準備できませんでした。");
			ctx.fillStyle = "#f5f1e8";
			ctx.fillRect(0, 0, 2048, 2048);
			const fit = Math.min(
					2048 / image.naturalWidth,
					2048 / image.naturalHeight,
				),
				width = image.naturalWidth * fit,
				height = image.naturalHeight * fit;
			ctx.drawImage(
				image,
				(2048 - width) / 2,
				(2048 - height) / 2,
				width,
				height,
			);
			texture = new THREE.CanvasTexture(canvas);
			texture.colorSpace = THREE.SRGBColorSpace;
			texture.flipY = false;
			texture.anisotropy = Math.min(
				4,
				this.renderer.capabilities.getMaxAnisotropy(),
			);
			if (!this.picture || !this.bounds)
				throw new Error("額縁を準備できませんでした。");
			nextBack = artworkBack(info, this.bounds);
			for (const material of Array.isArray(this.picture.material)
				? this.picture.material
				: [this.picture.material])
				disposeMaterial(material);
			this.front?.dispose();
			this.front = texture;
			this.picture.material = new THREE.MeshBasicMaterial({
				map: texture,
				toneMapped: false,
				side: THREE.DoubleSide,
			});
			this.disposeBack();
			this.back = nextBack;
			this.display.add(nextBack.mesh);
			this.display.visible = true;
			this.invalidate();
			this.onState({ loading: false, error: "" });
		} catch (cause) {
			texture?.dispose();
			if (nextBack) {
				nextBack.mesh.geometry.dispose();
				disposeMaterial(nextBack.mesh.material);
			}
			if (!this.disposed && revision === this.revision)
				this.onState({
					loading: false,
					error:
						cause instanceof Error &&
						cause.name !== "AbortError" &&
						cause.name !== "TimeoutError"
							? cause.message
							: "読み込みに時間がかかっています。再試行してください。",
				});
		} finally {
			clearTimeout(timeout);
		}
	}
	private disposeBack() {
		if (this.back) {
			this.display.remove(this.back.mesh);
			this.back.mesh.geometry.dispose();
			disposeMaterial(this.back.mesh.material);
			this.back = undefined;
		}
	}
	dispose() {
		this.disposed = true;
		this.revision++;
		this.request?.abort();
		this.lifetime.abort();
		cancelAnimationFrame(this.frame);
		this.observer.disconnect();
		this.motion.removeEventListener("change", this.invalidate);
		document.removeEventListener("visibilitychange", this.visibility);
		this.disposeBack();
		if (this.model) disposeModel(this.model);
		this.front?.dispose();
		this.renderer.dispose();
		this.renderer.domElement.remove();
	}
}
