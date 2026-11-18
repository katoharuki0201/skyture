import { z } from "zod";

const weatherSchema = z.enum(["clear", "cloudy", "rain", "snow", "storm"]);
const timeSchema = z.enum(["day", "twilight", "night"]);
export const artworkLocationSchema = z.object({
	name: z.string(),
	timezone: z.string(),
});
export type ArtworkLocation = z.infer<typeof artworkLocationSchema>;
export const artworkSchema = z.object({
	id: z.string().min(1),
	title: z.string(),
	artist: z.string(),
	date: z.string(),
	image: z.url(),
	link: z.url(),
	weather: z.string(),
	time: z.string(),
});
export const selectionSchema = z.object({
	artwork: artworkSchema,
	conditions: z.object({
		weather: weatherSchema,
		time: timeSchema,
		temperature: z.number().finite(),
	}),
	generatedAt: z.string().refine((value) => Number.isFinite(Date.parse(value))),
	fallback: z.boolean(),
	location: artworkLocationSchema.optional(),
});
export type Weather = z.infer<typeof weatherSchema>;
export type TimeOfDay = z.infer<typeof timeSchema>;
export type Artwork = z.infer<typeof artworkSchema>;
export type Selection = z.infer<typeof selectionSchema>;
export type Conditions = Selection["conditions"];
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
