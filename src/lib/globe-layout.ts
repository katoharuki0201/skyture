import { cities } from "../data/cities";
export const initialGlobePose = { phi: 2.3, theta: 0.22 };
export type GlobePose = typeof initialGlobePose;
export type GlobePoint = {
	id: string;
	x: number;
	y: number;
	anchorX: number;
	anchorY: number;
};

// Same orthographic projection as COBE, radius 0.8 and markerElevation 0.
export function globeLayout(pose: GlobePose, width: number): GlobePoint[] {
	const { phi, theta } = pose;
	const points: GlobePoint[] = [];
	for (const city of cities) {
		const lat = (city.latitude * Math.PI) / 180,
			lon = (city.longitude * Math.PI) / 180 - Math.PI;
		const x = -Math.cos(lat) * Math.cos(lon) * 0.8,
			y = Math.sin(lat) * 0.8,
			z = Math.cos(lat) * Math.sin(lon) * 0.8;
		const rx = Math.cos(phi) * x + Math.sin(phi) * z;
		const ry =
			Math.sin(phi) * Math.sin(theta) * x +
			Math.cos(theta) * y -
			Math.cos(phi) * Math.sin(theta) * z;
		const rz =
			-Math.sin(phi) * Math.cos(theta) * x +
			Math.sin(theta) * y +
			Math.cos(phi) * Math.cos(theta) * z;
		if (rz <= 0.08) continue;
		const anchorX = ((rx + 1) * width) / 2,
			anchorY = ((1 - ry) * width) / 2;
		points.push({ id: city.id, x: anchorX, y: anchorY - 64, anchorX, anchorY });
	}
	for (let pass = 0; pass < 4; pass++)
		for (let i = 0; i < points.length; i++)
			for (let j = i + 1; j < points.length; j++) {
				const a = points[i],
					b = points[j],
					dx = b.x - a.x,
					dy = b.y - a.y,
					distance = Math.hypot(dx, dy);
				if (distance >= 100) continue;
				const shift = (100 - distance) / 2,
					nx = distance > 0.01 ? dx / distance : 1,
					ny = distance > 0.01 ? dy / distance : 0;
				a.x -= nx * shift;
				a.y -= ny * shift;
				b.x += nx * shift;
				b.y += ny * shift;
			}
	for (const point of points) {
		point.x = Math.max(44, Math.min(width - 44, point.x));
		point.y = Math.min(
			point.anchorY - 64,
			Math.max(24, Math.min(width - 54, point.y)),
		);
	}
	return points;
}
