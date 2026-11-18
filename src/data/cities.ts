export const cities = [
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
export type City = (typeof cities)[number];
