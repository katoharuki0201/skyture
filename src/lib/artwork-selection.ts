import { z } from "zod";
import data from "../data/artworks.json";
import { apiClient } from "./api-client";
import type { Coordinates } from "./location";
import { retryWeatherRequest, WeatherError } from "./weather-error";

export type Weather = "clear" | "cloudy" | "rain" | "snow" | "storm";
export type TimeOfDay = "day" | "twilight" | "night";
export const weatherLabels: Record<Weather, string> = {
	clear: "晴",
	cloudy: "曇",
	rain: "雨",
	snow: "雪",
	storm: "嵐",
};
export const timeLabels: Record<TimeOfDay, string> = {
	day: "昼",
	twilight: "朝・夕",
	night: "夜",
};
export type Artwork = (typeof data.artworks)[number];
export type Conditions = {
	weather: Weather;
	time: TimeOfDay;
	temperature: number;
};
export type Selection = {
	artwork: Artwork;
	conditions: Conditions;
	generatedAt: string;
	fallback: boolean;
};
const storageKey = "skyture.artwork-history.v1";

const forecastSchema = z.object({
	current: z.object({
		time: z.number(),
		weather_code: z.number(),
		temperature_2m: z.number(),
		is_day: z.union([z.literal(0), z.literal(1)]),
	}),
	daily: z.object({
		sunrise: z.array(z.number().nullable()),
		sunset: z.array(z.number().nullable()),
	}),
});

export function classifyWeather(code: number): Weather {
	if ([0, 1].includes(code)) return "clear";
	if ([2, 3, 45, 48].includes(code)) return "cloudy";
	if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code))
		return "rain";
	if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
	if ([95, 96, 99].includes(code)) return "storm";
	throw new WeatherError(
		"classification",
		"取得した天気コードを分類できませんでした。",
	);
}

export function classifyTime(
	now: number,
	sunrise: number | null | undefined,
	sunset: number | null | undefined,
	isDay: number,
): TimeOfDay {
	if (
		[sunrise, sunset].some(
			(value) => value != null && Math.abs(now - value) <= 3600,
		)
	)
		return "twilight";
	return isDay === 1 ? "day" : "night";
}

export async function fetchConditions(
	coords: Coordinates,
): Promise<Conditions> {
	const raw = await retryWeatherRequest(() =>
		apiClient
			.get("https://api.open-meteo.com/v1/forecast", {
				searchParams: {
					...coords,
					current: "temperature_2m,weather_code,is_day",
					daily: "sunrise,sunset",
					timezone: "auto",
					timeformat: "unixtime",
					forecast_days: 1,
				},
				timeout: 15000,
			})
			.json(),
	);
	const parsed = forecastSchema.safeParse(raw);
	if (!parsed.success)
		throw new WeatherError(
			"data",
			"天気サービスのデータ形式が想定と異なるか、必要な情報が欠けています。",
			{ cause: parsed.error },
		);
	const { current, daily } = parsed.data;
	return {
		weather: classifyWeather(current.weather_code),
		time: classifyTime(
			current.time,
			daily.sunrise[0],
			daily.sunset[0],
			current.is_day,
		),
		temperature: current.temperature_2m,
	};
}

export function pickArtwork(
	conditions: Conditions,
	random = Math.random,
): { artwork: Artwork; fallback: boolean } {
	const matches = data.artworks.filter(
		(artwork) =>
			artwork.weather === conditions.weather &&
			artwork.time === conditions.time,
	);
	const pool = matches.length ? matches : data.artworks;
	const artwork = pool[Math.floor(random() * pool.length)];
	if (!artwork) throw new Error("表示できる作品がありません。");
	return { artwork, fallback: matches.length === 0 };
}

export function localDateKey(date: Date): string {
	return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function readHistory(): Selection[] {
	const raw: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
	if (!Array.isArray(raw))
		throw new Error("保存された作品履歴を読み込めませんでした。");
	return raw.filter(
		(entry): entry is Selection =>
			entry &&
			typeof entry.generatedAt === "string" &&
			!Number.isNaN(Date.parse(entry.generatedAt)) &&
			data.artworks.some((a) => a.id === entry.artwork?.id) &&
			entry.conditions &&
			entry.conditions.weather in weatherLabels &&
			entry.conditions.time in timeLabels &&
			typeof entry.conditions.temperature === "number",
	);
}

export function readToday(): Selection | null {
	return (
		readHistory()
			.reverse()
			.find(
				(entry) =>
					localDateKey(new Date(entry.generatedAt)) ===
					localDateKey(new Date()),
			) ?? null
	);
}

export function saveSelection(selection: Selection): Selection {
	// A second tab may already have generated today's artwork while location was loading.
	const existing = readToday();
	if (existing) return existing;
	localStorage.setItem(
		storageKey,
		JSON.stringify([...readHistory(), selection]),
	);
	return selection;
}
