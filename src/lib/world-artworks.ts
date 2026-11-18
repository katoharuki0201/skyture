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
	loading: string[];
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
		loading: [],
	};
}

function readRecords(date: string) {
	return readWorldDay(date).records;
}

type WorldJob = {
	snapshot: WorldDay;
	listeners: Set<(snapshot: WorldDay) => void>;
	promise: Promise<WorldDay>;
};
const pending = new Map<string, WorldJob>();

function subscribe(
	job: WorldJob,
	onUpdate?: (snapshot: WorldDay) => void,
	signal?: AbortSignal,
) {
	if (!onUpdate || signal?.aborted) return;
	job.listeners.add(onUpdate);
	onUpdate(job.snapshot);
	signal?.addEventListener("abort", () => job.listeners.delete(onUpdate), {
		once: true,
	});
}

export function loadWorldDay(
	onUpdate?: (snapshot: WorldDay) => void,
	signal?: AbortSignal,
): Promise<WorldDay> {
	const date = localDateKey(new Date());
	const existing = pending.get(date);
	if (existing) {
		subscribe(existing, onUpdate, signal);
		return existing.promise;
	}
	const initial = readWorldDay(date);
	initial.loading = worldCities
		.filter((city) => !initial.records[city.id])
		.map((city) => city.id);
	const job: WorldJob = {
		snapshot: initial,
		listeners: new Set(),
		promise: Promise.resolve(initial),
	};
	pending.set(date, job);
	subscribe(job, onUpdate, signal);
	const notify = () => {
		for (const listener of job.listeners) listener(job.snapshot);
	};
	job.promise = Promise.all(
		worldCities.map(async (city) => {
			if (initial.records[city.id]) return;
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
				const stored = readRecords(date);
				const records = {
					...job.snapshot.records,
					...stored,
					[city.id]: stored[city.id] ?? selection,
				};
				if (localDateKey(new Date()) === date)
					localStorage.setItem(storageKey, JSON.stringify({ date, records }));
				job.snapshot = { ...job.snapshot, records };
			} catch (cause) {
				job.snapshot = {
					...job.snapshot,
					errors: {
						...job.snapshot.errors,
						[city.id]:
							cause instanceof Error
								? cause.message
								: "この都市の作品を取得できませんでした。",
					},
				};
			} finally {
				job.snapshot = {
					...job.snapshot,
					loading: job.snapshot.loading.filter((id) => id !== city.id),
				};
				notify();
			}
		}),
	)
		.then(() => job.snapshot)
		.finally(() => {
			pending.delete(date);
			job.listeners.clear();
		});
	return job.promise;
}
