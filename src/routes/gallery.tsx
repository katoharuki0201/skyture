import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/gallery")({ component: GalleryPage });

function GalleryPage() {
	return (
		<main className="app-page">
			<header className="page-heading">
				<p className="page-eyebrow">GALLERY</p>
				<h1>ギャラリー</h1>
				<p className="page-description">これまでに出会った絵画を振り返る。</p>
			</header>
		</main>
	);
}
