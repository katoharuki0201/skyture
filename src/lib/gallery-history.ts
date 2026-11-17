import { localDateKey, type Selection } from "./artwork-selection";

export type GalleryDay = {
	key: string;
	date: Date;
	selection: Selection | null;
};

export function galleryDays(history: Selection[]): GalleryDay[] {
	const records = new Map<string, Selection>();
	for (const entry of [...history].sort(
		(a, b) => Date.parse(a.generatedAt) - Date.parse(b.generatedAt),
	))
		records.set(localDateKey(new Date(entry.generatedAt)), entry);
	if (!records.size) return [];
	const timestamps = [...records.values()].map((entry) =>
		new Date(entry.generatedAt).getTime(),
	);
	const cursor = new Date(Math.min(...timestamps));
	const last = new Date(Math.max(...timestamps));
	cursor.setHours(12, 0, 0, 0);
	last.setHours(12, 0, 0, 0);
	const days: GalleryDay[] = [];
	while (cursor <= last) {
		const key = localDateKey(cursor);
		days.push({
			key,
			date: new Date(cursor),
			selection: records.get(key) ?? null,
		});
		cursor.setDate(cursor.getDate() + 1);
	}
	return days;
}

export function temperatureSegments(
	days: GalleryDay[],
): { index: number; temperature: number }[][] {
	const segments: { index: number; temperature: number }[][] = [];
	let segment: { index: number; temperature: number }[] = [];
	days.forEach((day, index) => {
		if (day.selection)
			segment.push({
				index,
				temperature: day.selection.conditions.temperature,
			});
		else if (segment.length) {
			segments.push(segment);
			segment = [];
		}
	});
	if (segment.length) segments.push(segment);
	return segments;
}
