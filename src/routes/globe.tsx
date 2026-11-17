import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/globe")({ component: GlobePage });

function GlobePage() {
	return (
		<main className="app-page">
			<header className="page-heading">
				<p className="page-eyebrow">WORLD</p>
				<h1>地球儀</h1>
				<p className="page-description">世界の空と、絵画をめぐる。</p>
			</header>
		</main>
	);
}
