import { z } from "zod";
import { apiClient } from "./api-client";
import type { Conditions, TimeOfDay, Weather } from "./artwork";
import type { Coordinates } from "./location";
import { retryWeatherRequest, WeatherError } from "./weather-error";

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
