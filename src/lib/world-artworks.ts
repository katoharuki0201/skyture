import { z } from "zod";
import { type Selection, selectionSchema } from "./artwork";
import { pickArtwork } from "./artwork-selection";
import { localDateKey } from "./local-date";
import { fetchConditions } from "./weather";

export const worldCities = [
	{
		id: "tokyo",
		name: "東京",
		latitude: 35.6762,
		longitude: 139.6503,
		timezone: "Asia/Tokyo",
	},
	{
		id: "london",
		name: "ロンドン",
		latitude: 51.5074,
		longitude: -0.1278,
		timezone: "Europe/London",
	},
	{
		id: "paris",
		name: "パリ",
		latitude: 48.8566,
		longitude: 2.3522,
		timezone: "Europe/Paris",
	},
	{
		id: "new-york",
		name: "ニューヨーク",
		latitude: 40.7128,
		longitude: -74.006,
		timezone: "America/New_York",
	},
	{
		id: "sydney",
		name: "シドニー",
		latitude: -33.8688,
		longitude: 151.2093,
		timezone: "Australia/Sydney",
	},
	{
		id: "singapore",
		name: "シンガポール",
		latitude: 1.3521,
		longitude: 103.8198,
		timezone: "Asia/Singapore",
	},
	{
		id: "dubai",
		name: "ドバイ",
		latitude: 25.2048,
		longitude: 55.2708,
		timezone: "Asia/Dubai",
	},
	{
		id: "cape-town",
		name: "ケープタウン",
		latitude: -33.9249,
		longitude: 18.4241,
		timezone: "Africa/Johannesburg",
	},
] as const;
export type WorldCity = (typeof worldCities)[number];
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
