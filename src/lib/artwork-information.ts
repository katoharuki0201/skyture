import {
	type ArtworkLocation,
	type Selection,
	timeLabels,
	weatherLabels,
} from "./artwork";

export function artworkInformation(
	selection: Selection,
	location = selection.location,
) {
	const fields = [
		{ label: "天気", value: weatherLabels[selection.conditions.weather] },
		{ label: "時間帯", value: timeLabels[selection.conditions.time] },
		{ label: "気温", value: `${selection.conditions.temperature.toFixed(1)}℃` },
	];
	if (location) {
		fields.push({ label: "都市", value: location.name });
		fields.push({
			label: "取得時の現地日時",
			value: localTimestamp(selection.generatedAt, location),
		});
	}
	return {
		title: selection.artwork.title,
		artist: selection.artwork.artist,
		date: selection.artwork.date,
		fields,
	};
}
function localTimestamp(date: string, location: ArtworkLocation): string {
	const options: Intl.DateTimeFormatOptions = {
		timeZone: location.timezone,
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
	};
	try {
		return new Intl.DateTimeFormat("ja-JP", options).format(new Date(date));
	} catch {
		return new Date(date).toLocaleString("ja-JP");
	}
}
export type ArtworkInformation = ReturnType<typeof artworkInformation>;
