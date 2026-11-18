import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { GenerationIndicator } from "../components/generation-loading";
import { TemperatureHistory } from "../components/temperature-history";
import { WeatherAttribution } from "../components/weather-attribution";
import type { Selection } from "../lib/artwork";
import { readHistory } from "../lib/artwork-history";
import { galleryDays } from "../lib/gallery-history";

const GalleryExhibition = lazy(
	() => import("../components/gallery-exhibition"),
);
export const Route = createFileRoute("/gallery")({ component: GalleryPage });

function GalleryPage() {
	const [history, setHistory] = useState<Selection[]>([]);
	const [ready, setReady] = useState(false);
	const [error, setError] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);
	const days = useMemo(() => galleryDays(history), [history]);
	useEffect(() => {
		const update = () => {
			try {
				const records = readHistory();
				setHistory(records);
				setSelectedIndex(Math.max(0, galleryDays(records).length - 1));
				setError("");
			} catch {
				setError(
					"作品の履歴を読み込めませんでした。ブラウザのストレージ設定を確認してください。",
				);
			}
			setReady(true);
		};
		update();
		window.addEventListener("storage", update);
		return () => window.removeEventListener("storage", update);
	}, []);
	const day = days[selectedIndex];
	return (
		<main className="gallery-page">
			{error ? (
				<p className="generation-error" role="alert">
					{error}
				</p>
			) : !ready ? (
				<div className="gallery-empty">
					<GenerationIndicator stage="artwork" />
				</div>
			) : !day ? (
				<p className="gallery-empty">まだ作品の記録がありません。</p>
			) : (
				<>
					<div className="gallery-exhibition-area">
						{day.selection ? (
							<Suspense
								fallback={
									<div className="gallery-empty">
										<GenerationIndicator stage="artwork" />
									</div>
								}
							>
								<GalleryExhibition selection={day.selection} />
							</Suspense>
						) : null}
					</div>
					<TemperatureHistory
						days={days}
						selectedIndex={selectedIndex}
						onSelect={setSelectedIndex}
					/>
					<WeatherAttribution />
				</>
			)}
		</main>
	);
}
