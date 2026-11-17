import type { Artwork } from "./artwork-selection";

const localImages: Record<string, { source: string; path: string }> = {
	"met-10181": {
		source: "https://images.metmuseum.org/CRDImages/ad/web-large/ap29.35.jpg",
		path: "artworks/met-10181.jpg",
	},
	"met-11181": {
		source: "https://images.metmuseum.org/CRDImages/ad/web-large/06.170.jpg",
		path: "artworks/met-11181.jpg",
	},
};

export function artworkImageUrl(artwork: Artwork): string {
	const local = localImages[artwork.id];
	return local?.source === artwork.image
		? `${import.meta.env.BASE_URL}${local.path}`
		: artwork.image;
}
