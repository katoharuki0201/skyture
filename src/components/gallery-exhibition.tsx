import type { Selection } from "../lib/artwork";
import { ArtworkViewer } from "./artwork-viewer";

export default function GalleryExhibition({
	selection,
}: {
	selection: Selection;
}) {
	return <ArtworkViewer selection={selection} flippable />;
}
