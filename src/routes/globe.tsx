import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { useWorldArtworks } from "../hooks/use-world-artworks";
import { type WorldCity, worldCities } from "../lib/world-artworks";

const WorldGlobe = lazy(() =>
	import("../components/world-globe").then((module) => ({
		default: module.WorldGlobe,
	})),
);

export const Route = createFileRoute("/globe")({ component: GlobePage });
const ArtworkModal = lazy(() => import("../components/artwork-modal"));

function GlobePage() {
	const { snapshot, loading, error, retry } = useWorldArtworks();
	const [opened, setOpened] = useState<{
		city: WorldCity;
		date: string;
	} | null>(null);
	const city = opened?.date === snapshot?.date ? (opened?.city ?? null) : null;

	return (
		<main className="world-page" aria-label="世界の空と絵画">
			<Suspense
				fallback={
					<output className="world-status">地球儀を準備しています…</output>
				}
			>
				<WorldGlobe
					snapshot={snapshot}
					loading={loading}
					onSelect={(city) => {
						if (snapshot) setOpened({ city, date: snapshot.date });
					}}
					paused={city !== null}
				/>
			</Suspense>
			{loading && (
				<output className="world-fetch-status">
					世界の空を確認しています…
				</output>
			)}
			{error && (
				<div className="world-page-error">
					<p role="alert">{error}</p>
					<button type="button" onClick={retry}>
						もう一度試す
					</button>
				</div>
			)}
			{!loading && snapshot && Object.keys(snapshot.errors).length > 0 && (
				<div className="world-page-error">
					<details>
						<summary>
							{Object.keys(snapshot.errors).length}
							都市の作品を取得できませんでした
						</summary>
						{Object.entries(snapshot.errors).map(([id, message]) => (
							<p key={id}>
								{worldCities.find((city) => city.id === id)?.name}：{message}
							</p>
						))}
					</details>
					<button type="button" onClick={retry}>
						もう一度試す
					</button>
				</div>
			)}
			{city && snapshot?.records[city.id] && (
				<Suspense fallback={null}>
					<ArtworkModal
						selection={snapshot.records[city.id]}
						location={city}
						onClose={() => setOpened(null)}
					/>
				</Suspense>
			)}
		</main>
	);
}
