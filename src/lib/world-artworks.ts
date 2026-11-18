import { z } from "zod";
import { cities as worldCities } from "../data/cities";
import { type Selection, selectionSchema } from "./artwork";
import { pickArtwork } from "./artwork-selection";
import { localDateKey } from "./local-date";
import { fetchConditions } from "./weather";

export { type City as WorldCity, cities as worldCities } from "../data/cities";
export type WorldDay = {
	date: string;
	records: Record<string, Selection>;
	errors: Record<string, string>;
};
const storageKey = "skyture.world-artworks.v1";
const cacheSchema = z.object({
	date: z.string(),
	records: z.record(z.string(), selectionSchema),
});
export function readWorldDay(date = localDateKey(new Date())): WorldDay {
	const raw = localStorage.getItem(storageKey);
	const parsed = cacheSchema.safeParse(raw ? JSON.parse(raw) : null);
	return {
		date,
		records:
			parsed.success && parsed.data.date === date ? parsed.data.records : {},
		errors: {},
	};
}

function readRecords(date: string) {
	return readWorldDay(date).records;
}

// Share pending requests across React remounts; completed cities are cached separately.
const pending = new Map<string, Promise<WorldDay>>();
export function loadWorldDay(): Promise<WorldDay> {
	const date = localDateKey(new Date());
	const existing = pending.get(date);
	if (existing) return existing;
	const operation = (async () => {
		const records = readRecords(date);
		const errors: Record<string, string> = {};
		await Promise.all(
			worldCities.map(async (city) => {
				if (records[city.id]) return;
				try {
					const conditions = await fetchConditions({
						latitude: city.latitude,
						longitude: city.longitude,
					});
					const selection = {
						...pickArtwork(conditions),
						conditions,
						generatedAt: new Date().toISOString(),
					};
					// Another tab may have saved this city while the request was running.
					const stored = readRecords(date);
					records[city.id] = stored[city.id] ?? selection;
					if (localDateKey(new Date()) === date)
						localStorage.setItem(
							storageKey,
							JSON.stringify({ date, records: { ...stored, ...records } }),
						);
				} catch (cause) {
					delete records[city.id];
					errors[city.id] =
						cause instanceof Error
							? cause.message
							: "この都市の作品を取得できませんでした。";
				}
			}),
		);
		return { date, records, errors };
	})();
	pending.set(date, operation);
	void operation
		.finally(() => {
			if (pending.get(date) === operation) pending.delete(date);
		})
		.catch(() => {});
	return operation;
}
