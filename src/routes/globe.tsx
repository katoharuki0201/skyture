import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { localDateKey } from "../lib/artwork-selection";
import {
	loadWorldDay,
	type WorldCity,
	type WorldDay,
	worldCities,
} from "../lib/world-artworks";

const WorldGlobe = lazy(() =>
	import("../components/world-globe").then((module) => ({
		default: module.WorldGlobe,
	})),
);

export const Route = createFileRoute("/globe")({ component: GlobePage });
const ArtworkModal = lazy(() => import("../components/artwork-modal"));

function GlobePage() {
	const [snapshot, setSnapshot] = useState<WorldDay | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [city, setCity] = useState<WorldCity | null>(null);
	const refresh = useRef<() => void>(() => {});
	useEffect(() => {
		let active = true;
		let fetching = false;
		let loadedDate = "";
		const load = async () => {
			if (fetching) return;
			fetching = true;
			const date = localDateKey(new Date());
			setLoading(true);
			setError("");
			try {
				const result = await loadWorldDay();
				if (active) {
					loadedDate = date;
					if (date === localDateKey(new Date())) setSnapshot(result);
				}
			} catch {
				if (active) {
					setError(
						"都市の作品データを保存・読み込みできません。ブラウザのストレージ設定を確認してください。",
					);
					loadedDate = date;
				}
			} finally {
				fetching = false;
				if (active) setLoading(false);
			}
		};
		refresh.current = () => {
			void load();
		};
		const checkDate = () => {
			if (loadedDate && loadedDate !== localDateKey(new Date())) {
				setSnapshot(null);
				setCity(null);
				void load();
			}
		};
		void load();
		const timer = window.setInterval(checkDate, 1000);
		window.addEventListener("focus", checkDate);
		return () => {
			active = false;
			clearInterval(timer);
			window.removeEventListener("focus", checkDate);
		};
	}, []);
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
					onSelect={setCity}
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
					<button type="button" onClick={() => refresh.current()}>
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
					<button type="button" onClick={() => refresh.current()}>
						もう一度試す
					</button>
				</div>
			)}
			{city && snapshot?.records[city.id] && (
				<Suspense fallback={null}>
					<ArtworkModal
						selection={snapshot.records[city.id]}
						location={city}
						onClose={() => setCity(null)}
					/>
				</Suspense>
			)}
		</main>
	);
}
