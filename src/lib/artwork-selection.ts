import data from "../data/artworks.json";
import type { Artwork, Conditions } from "./artwork";

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
