import * as THREE from "three";
import type { ArtworkInformation } from "./artwork-information";

export function artworkBack(info: ArtworkInformation, bounds: THREE.Box3) {
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = 1536;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("作品情報を準備できませんでした。");
	const blocks = [
		{ text: info.title, size: 76, weight: 700, gap: 40 },
		{ text: info.artist, size: 48, weight: 400, gap: 0 },
		{ text: info.date, size: 42, weight: 400, gap: 70 },
		...info.fields.map((field) => ({
			text: `${field.label}　${field.value}`,
			size: field.label === "取得時の現地日時" ? 38 : 46,
			weight: 400,
			gap: 0,
		})),
	];
	const lines: { text: string; size: number; weight: number; gap: number }[] =
		[];
	for (const block of blocks) {
		ctx.font = `${block.weight} ${block.size}px "Noto Sans JP", sans-serif`;
		let text = "";
		for (const char of block.text) {
			if (text && ctx.measureText(text + char).width > 1080) {
				lines.push({ ...block, text, gap: 0 });
				text = "";
			}
			text += char;
		}
		lines.push({ ...block, text });
	}
	const height = lines.reduce(
		(sum, line) => sum + line.size * 1.5 + line.gap,
		0,
	);
	const scale = Math.min(1, 1096 / height);
	ctx.fillStyle = "#181a1d";
	ctx.fillRect(0, 0, 1536, 1536);
	ctx.fillStyle = "#f5f5f4";
	ctx.textBaseline = "top";
	let y = 220;
	for (const line of lines) {
		ctx.font = `${line.weight} ${line.size * scale}px "Noto Sans JP", sans-serif`;
		ctx.fillText(line.text, 228, y);
		y += (line.size * 1.5 + line.gap) * scale;
		if (line.gap === 70) {
			ctx.fillStyle = "#929aa6";
			ctx.fillRect(228, y - 35 * scale, 1080, 2);
			ctx.fillStyle = "#f5f5f4";
		}
	}
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	const mesh = new THREE.Mesh(
		new THREE.PlaneGeometry(
			bounds.max.x - bounds.min.x,
			bounds.max.y - bounds.min.y,
		),
		new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
	);
	mesh.position.set(0, 0, bounds.min.z - 0.005);
	mesh.rotation.y = Math.PI;
	return { mesh, texture };
}
