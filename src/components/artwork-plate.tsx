import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import plateModelUrl from "../assets/plate.glb?url";
import {
	type Selection,
	timeLabels,
	weatherLabels,
} from "../lib/artwork-selection";

export function ArtworkPlate({ selection }: { selection: Selection }) {
	const mount = useRef<HTMLDivElement>(null);
	const [ready, setReady] = useState(false);
	const [failed, setFailed] = useState(false);
	useEffect(() => {
		const element = mount.current;
		if (!element) return;
		let active = true;
		let model: THREE.Group | undefined;
		let renderer: THREE.WebGLRenderer;
		const controller = new AbortController();
		const timeout = window.setTimeout(() => controller.abort(), 15000);
		try {
			renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
		} catch {
			window.clearTimeout(timeout);
			setFailed(true);
			return;
		}
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
		renderer.outputColorSpace = THREE.SRGBColorSpace;
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 0.85;
		element.appendChild(renderer.domElement);
		const scene = new THREE.Scene();
		// A dark studio with narrow softboxes, rather than a bright room reflected
		// across the whole plate. Keep the exported metalness/roughness untouched.
		const studio = new THREE.Scene();
		studio.background = new THREE.Color(0x101216);
		const softbox = (
			width: number,
			height: number,
			position: [number, number, number],
			strength: number,
		) => {
			const panel = new THREE.Mesh(
				new THREE.PlaneGeometry(width, height),
				new THREE.MeshBasicMaterial({
					color: new THREE.Color(strength, strength, strength),
					side: THREE.DoubleSide,
					toneMapped: false,
				}),
			);
			panel.position.set(...position);
			panel.lookAt(0, 0, 0);
			studio.add(panel);
		};
		softbox(0.65, 5, [-3.5, 1.8, 3], 2.5);
		softbox(0.4, 4, [3.5, -0.5, 2.5], 1.5);
		softbox(5, 0.45, [0, 4, 1.5], 2);
		softbox(5, 3, [1, 1, 5], 0.6);
		const pmrem = new THREE.PMREMGenerator(renderer);
		const environment = pmrem.fromScene(studio, 0.015);
		scene.environment = environment.texture;
		studio.traverse((object) => {
			if (object instanceof THREE.Mesh) {
				object.geometry.dispose();
				object.material.dispose();
			}
		});
		pmrem.dispose();
		const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20);
		camera.position.set(0, 0, 5);
		camera.lookAt(0, 0, 0);
		scene.add(new THREE.HemisphereLight(0xffffff, 0x78716a, 0.2));
		const light = new THREE.DirectionalLight(0xfff4df, 1);
		light.position.set(-3, 4, 5);
		scene.add(light);
		const resize = () => {
			const width = element.clientWidth,
				height = element.clientHeight;
			if (!width || !height) return;
			renderer.setSize(width, height);
			const aspect = width / height;
			camera.aspect = aspect;
			const distance =
				1.65 / (Math.tan(THREE.MathUtils.degToRad(17.5)) * aspect);
			camera.position.set(0, 0, distance);
			camera.lookAt(0, 0, 0);
			camera.updateProjectionMatrix();
			renderer.render(scene, camera);
		};
		const observer = new ResizeObserver(resize);
		observer.observe(element);
		resize();
		const load = async () => {
			try {
				const base = `${import.meta.env.BASE_URL}models/`;
				const response = await fetch(plateModelUrl, {
					signal: controller.signal,
				});
				if (!response.ok) throw new Error("plate load failed");
				const gltf = await new GLTFLoader().parseAsync(
					await response.arrayBuffer(),
					base,
				);
				model = gltf.scene;
				if (!active) {
					dispose();
					return;
				}
				model.updateMatrixWorld(true);
				const bounds = new THREE.Box3().setFromObject(model);
				const center = bounds.getCenter(new THREE.Vector3());
				const scale = 3 / (bounds.max.x - bounds.min.x);
				model.position.copy(center).multiplyScalar(-scale);
				model.scale.setScalar(scale);
				model.traverse((object) => {
					if (object instanceof THREE.Mesh) {
						for (const material of Array.isArray(object.material)
							? object.material
							: [object.material]) {
							if (material instanceof THREE.MeshStandardMaterial) {
								material.envMapIntensity = 0.8;
							}
						}
					}
				});
				scene.add(model);
				resize();
				setReady(true);
			} catch {
				if (active) setFailed(true);
			} finally {
				window.clearTimeout(timeout);
			}
		};
		function dispose() {
			model?.traverse((object) => {
				if (object instanceof THREE.Mesh) {
					object.geometry.dispose();
					for (const material of Array.isArray(object.material)
						? object.material
						: [object.material])
						material.dispose();
				}
			});
		}
		void load();
		return () => {
			active = false;
			controller.abort();
			window.clearTimeout(timeout);
			observer.disconnect();
			dispose();
			environment.dispose();
			renderer.dispose();
			renderer.domElement.remove();
		};
	}, []);

	return (
		<section
			className={`artwork-plate${failed ? " is-fallback" : ""}`}
			aria-label="作品キャプション"
		>
			<div ref={mount} className="artwork-plate-model" aria-hidden="true" />
			{!ready && !failed ? (
				<output className="artwork-plate-loading">
					キャプションを準備しています…
				</output>
			) : (
				<div className="artwork-plate-text">
					<h1 id="artwork-modal-title">{selection.artwork.title}</h1>
					<p>
						{selection.artwork.artist}
						<br />
						{selection.artwork.date}
					</p>
					<dl className="artwork-plate-weather">
						<div>
							<dt>天気</dt>
							<dd>{weatherLabels[selection.conditions.weather]}</dd>
						</div>
						<div>
							<dt>時間帯</dt>
							<dd>{timeLabels[selection.conditions.time]}</dd>
						</div>
						<div>
							<dt>気温</dt>
							<dd>
								{selection.conditions.temperature.toFixed(1)}
								<span className="temperature-unit">℃</span>
							</dd>
						</div>
					</dl>
					{failed && (
						<p className="artwork-plate-note" role="alert">
							プレートを読み込めないため、文字で表示しています。
						</p>
					)}
				</div>
			)}
		</section>
	);
}
