import localImages from "../data/artwork-images.json";
import type { Artwork } from "./artwork";

const bySource = new Map(
	Object.values(localImages).map((entry) => [entry.source, entry.path]),
);

export function artworkImageUrl(artwork: Artwork): string {
	const path = bySource.get(artwork.image);
	return path ? `${import.meta.env.BASE_URL}${path}` : artwork.image;
}
