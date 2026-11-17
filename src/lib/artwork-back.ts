import * as THREE from "three";
import { type Selection, timeLabels, weatherLabels } from "./artwork-selection";

export function artworkBack(selection: Selection, bounds: THREE.Box3) {
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = 1536;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("作品情報を準備できませんでした。");
	ctx.fillStyle = "#181a1d";
	ctx.fillRect(0, 0, 1536, 1536);
	ctx.fillStyle = "#f5f5f4";
	ctx.textBaseline = "top";
	let y = 220;
	const text = (value: string, size: number, weight = 400) => {
		ctx.font = `${weight} ${size}px "Noto Sans JP", sans-serif`;
		let line = "";
		for (const char of value) {
			if (line && ctx.measureText(line + char).width > 1080) {
				ctx.fillText(line, 228, y);
				y += size * 1.5;
				line = "";
			}
			line += char;
		}
		ctx.fillText(line, 228, y);
		y += size * 1.5;
	};
	text(selection.artwork.title, 76, 700);
	y += 40;
	text(selection.artwork.artist, 48);
	text(selection.artwork.date, 42);
	y += 70;
	ctx.fillStyle = "#929aa6";
	ctx.fillRect(228, y, 1080, 2);
	y += 60;
	ctx.fillStyle = "#f5f5f4";
	text(`天気　${weatherLabels[selection.conditions.weather]}`, 46);
	text(`時間帯　${timeLabels[selection.conditions.time]}`, 46);
	text(`気温　${selection.conditions.temperature.toFixed(1)}℃`, 46);
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	const material = new THREE.MeshBasicMaterial({
		map: texture,
		toneMapped: false,
	});
	const mesh = new THREE.Mesh(
		new THREE.PlaneGeometry(
			bounds.max.x - bounds.min.x,
			bounds.max.y - bounds.min.y,
		),
		material,
	);
	mesh.position.set(0, 0, bounds.min.z - 0.005);
	mesh.rotation.y = Math.PI;
	return { mesh, texture };
}
