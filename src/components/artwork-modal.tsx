import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { artworkImageUrl } from "../lib/artwork-image";
import type { Selection } from "../lib/artwork-selection";
import { ArtworkPlate } from "./artwork-plate";
import { GenerationIndicator } from "./generation-loading";

export default function ArtworkModal({
	selection,
	onClose,
}: {
	selection: Selection;
	onClose: () => void;
}) {
	const dialog = useRef<HTMLDialogElement>(null);
	const container = useRef<HTMLDivElement>(null);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);
	const [attempt, setAttempt] = useState(0);
	const artworkUrl = `${artworkImageUrl(selection.artwork)}#attempt-${attempt}`;

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

	useEffect(() => {
		const element = container.current;
		if (!element) return;
		let active = true;
		let model: THREE.Group | undefined;
		let paintingTexture: THREE.CanvasTexture | undefined;
		let renderer: THREE.WebGLRenderer;
		const controller = new AbortController();
		const timeout = window.setTimeout(() => controller.abort(), 20000);
		setError("");
		setLoading(true);
		try {
			renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
		} catch {
			window.clearTimeout(timeout);
			setError("この端末では3D表示を利用できません。");
			setLoading(false);
			return;
		}
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
		renderer.outputColorSpace = THREE.SRGBColorSpace;
		element.appendChild(renderer.domElement);
		const scene = new THREE.Scene();
		const display = new THREE.Group();
		scene.add(display);
		const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
		camera.position.set(0, 0, 5.5);
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.06;
		controls.enablePan = false;
		controls.autoRotate = false;
		controls.minPolarAngle = 0;
		controls.maxPolarAngle = Math.PI;
		controls.target.set(0, 0, 0);
		let fitted = false;
		scene.add(new THREE.HemisphereLight(0xffffff, 0x6e7785, 1.1));
		const key = new THREE.DirectionalLight(0xfff7e8, 2);
		key.position.set(-3, 4, 5);
		scene.add(key);
		const fill = new THREE.DirectionalLight(0xdceaff, 0.7);
		fill.position.set(3, -1, 3);
		scene.add(fill);
		const resize = () => {
			const width = element.clientWidth,
				height = element.clientHeight;
			if (!width || !height) return;
			renderer.setSize(width, height);
			camera.aspect = width / height;
			if (!fitted) {
				const distance =
					1.85 /
					Math.tan(THREE.MathUtils.degToRad(17.5)) /
					Math.min(camera.aspect, 1);
				camera.position.set(0, 0, distance);
				controls.minDistance = distance * (0.78 / 1.55);
				controls.maxDistance = distance * (2.7 / 1.55);
				fitted = true;
			}
			// The reference viewer fills the screen; compensate for this smaller stage
			// so the same finger movement produces the same angular displacement.
			controls.rotateSpeed = height / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.render(scene, camera);
		};
		const interactionStart = () =>
			renderer.domElement.classList.add("is-dragging");
		const interactionEnd = () =>
			renderer.domElement.classList.remove("is-dragging");
		controls.addEventListener("start", interactionStart);
		controls.addEventListener("end", interactionEnd);
		let animation = 0;
		const render = () => {
			if (!active) return;
			controls.update();
			renderer.render(scene, camera);
			animation = window.requestAnimationFrame(render);
		};
		render();
		const observer = new ResizeObserver(resize);
		observer.observe(element);
		resize();

		async function load() {
			try {
				const base = `${import.meta.env.BASE_URL}models/`;
				const modelResponse = await fetch(`${base}frame.glb`, {
					signal: controller.signal,
				});
				if (!modelResponse.ok)
					throw new Error("額縁モデルを読み込めませんでした。");
				const gltf = await new GLTFLoader().parseAsync(
					await modelResponse.arrayBuffer(),
					base,
				);
				model = gltf.scene;
				if (!active) {
					model.traverse((object) => {
						if (object instanceof THREE.Mesh) {
							object.geometry.dispose();
							for (const material of Array.isArray(object.material)
								? object.material
								: [object.material])
								material.dispose();
						}
					});
					return;
				}
				const picture = model.getObjectByName("Picture");
				if (!(picture instanceof THREE.Mesh))
					throw new Error("モデル内にPictureの表示面が見つかりませんでした。");
				const bounds = new THREE.Box3().setFromObject(model);
				const center = bounds.getCenter(new THREE.Vector3());
				const scale =
					3 /
					Math.max(bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y);
				model.position.copy(center).multiplyScalar(-scale);
				model.scale.setScalar(scale);
				display.add(model);
				resize();
				const response = await fetch(artworkUrl, { signal: controller.signal });
				if (!response.ok) throw new Error("作品画像を読み込めませんでした。");
				const blob = await response.blob();
				const imageUrl = URL.createObjectURL(blob);
				const image = new Image();
				try {
					image.src = imageUrl;
					await image.decode();
				} finally {
					URL.revokeObjectURL(imageUrl);
				}
				if (!active) return;
				const canvas = document.createElement("canvas");
				canvas.width = canvas.height = 2048;
				const context = canvas.getContext("2d");
				if (!context) throw new Error("作品画像を準備できませんでした。");
				context.fillStyle = "#f5f1e8";
				context.fillRect(0, 0, 2048, 2048);
				const fit = Math.min(
					2048 / image.naturalWidth,
					2048 / image.naturalHeight,
				);
				const w = image.naturalWidth * fit,
					h = image.naturalHeight * fit;
				context.drawImage(image, (2048 - w) / 2, (2048 - h) / 2, w, h);
				paintingTexture = new THREE.CanvasTexture(canvas);
				paintingTexture.colorSpace = THREE.SRGBColorSpace;
				paintingTexture.flipY = false;
				paintingTexture.anisotropy = Math.min(
					4,
					renderer.capabilities.getMaxAnisotropy(),
				);
				const previousMaterials = Array.isArray(picture.material)
					? picture.material
					: [picture.material];
				picture.material = new THREE.MeshBasicMaterial({
					map: paintingTexture,
					toneMapped: false,
					side: THREE.DoubleSide,
				});
				for (const material of previousMaterials) material.dispose();
				resize();
				setLoading(false);
			} catch (cause) {
				if (active) {
					setError(
						cause instanceof TypeError
							? "作品画像を取得できませんでした。通信環境を確認して再試行してください。"
							: cause instanceof Error && cause.name !== "AbortError"
								? cause.message
								: "読み込みに時間がかかっています。再試行してください。",
					);
					setLoading(false);
				}
			} finally {
				window.clearTimeout(timeout);
			}
		}

		void load();
		return () => {
			active = false;
			window.cancelAnimationFrame(animation);
			controls.removeEventListener("start", interactionStart);
			controls.removeEventListener("end", interactionEnd);
			controls.dispose();
			controller.abort();
			window.clearTimeout(timeout);
			observer.disconnect();
			model?.traverse((object) => {
				if (object instanceof THREE.Mesh) {
					object.geometry.dispose();
					const materials = Array.isArray(object.material)
						? object.material
						: [object.material];
					for (const material of materials) material.dispose();
				}
			});
			paintingTexture?.dispose();
			renderer.dispose();
			renderer.domElement.remove();
		};
	}, [artworkUrl]);

	return (
		<dialog
			ref={dialog}
			className={`artwork-modal${loading ? " is-preparing" : ""}`}
			aria-labelledby="artwork-modal-title"
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
			<div
				ref={container}
				className="artwork-model-stage"
				role="img"
				aria-label="3Dの額縁に入った作品。ドラッグして回転できます。"
				aria-busy={loading}
			/>
			{loading && (
				<div className="artwork-preparing-overlay">
					<GenerationIndicator stage="artwork" />
				</div>
			)}
			{error && (
				<div className="artwork-modal-error" role="alert">
					<p>{error}</p>
					<button
						type="button"
						onClick={() => setAttempt((value) => value + 1)}
					>
						再読み込み
					</button>
				</div>
			)}
			<ArtworkPlate selection={selection} />
		</dialog>
	);
}
