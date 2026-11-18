import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock3 } from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { GenerationLoading } from "../components/generation-loading";
import type { Selection } from "../lib/artwork";
import { readToday, saveSelection } from "../lib/artwork-history";
import { pickArtwork } from "../lib/artwork-selection";
import { getCurrentLocation } from "../lib/location";
import { fetchConditions } from "../lib/weather";

const ArtworkModal = lazy(() => import("../components/artwork-modal"));

export const Route = createFileRoute("/")({ component: TodayPage });

function remainingUntilMidnight() {
	const now = new Date();
	const midnight = new Date(now);
	midnight.setHours(24, 0, 0, 0);
	const totalMinutes = Math.ceil((midnight.getTime() - now.getTime()) / 60_000);
	return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

function TodayPage() {
	const [remaining, setRemaining] = useState(remainingUntilMidnight);
	const [selection, setSelection] = useState<Selection | null>(null);
	const [stage, setStage] = useState<"idle" | "location" | "weather">("idle");
	const [error, setError] = useState("");
	const [historyReady, setHistoryReady] = useState(false);
	const inFlight = useRef(false);
	const [openedSelection, setOpenedSelection] = useState<Selection | null>(
		null,
	);

	async function generate() {
		if (inFlight.current) return;
		inFlight.current = true;
		setError("");
		try {
			const existing = readToday();
			if (existing) {
				setSelection(existing);
				return;
			}
			setStage("location");
			const coords = await getCurrentLocation();
			setStage("weather");
			const conditions = await fetchConditions(coords);
			const picked = pickArtwork(conditions);
			const result = saveSelection({
				...picked,
				conditions,
				generatedAt: new Date().toISOString(),
			});
			setSelection(result);
			setOpenedSelection(result);
		} catch (cause) {
			setError(
				cause instanceof Error
					? cause.message
					: "作品を取得できませんでした。再試行してください。",
			);
		} finally {
			inFlight.current = false;
			setStage("idle");
		}
	}

	useEffect(() => {
		const update = () => {
			setRemaining(remainingUntilMidnight());
			try {
				setSelection(readToday());
			} catch {
				setError(
					"作品履歴を保存・読み込みできません。ブラウザのストレージ設定を確認してください。",
				);
			}
			setHistoryReady(true);
		};
		update();
		const timer = window.setInterval(update, 1000);
		window.addEventListener("focus", update);
		window.addEventListener("storage", update);
		return () => {
			window.clearInterval(timer);
			window.removeEventListener("focus", update);
			window.removeEventListener("storage", update);
		};
	}, []);

	return (
		<main className="today-page" aria-label="今日の絵画">
			<p className="today-introduction">
				今いる場所の天気と時間に合わせて、
				<br />
				ぴったりの絵画を一枚おすすめします。
			</p>
			{error && (
				<p className="generation-error" role="alert">
					{error}
				</p>
			)}
			<div className="today-actions">
				<button
					type="button"
					className="painting-button"
					disabled={!historyReady || stage !== "idle" || !!selection}
					onClick={generate}
				>
					<span>
						{stage === "location"
							? "現在地を取得しています…"
							: stage === "weather"
								? "天気を確認しています…"
								: selection
									? "本日は取得済み"
									: error
										? "もう一度試す"
										: "今日の空をみる"}
					</span>
				</button>
				<div className="transparent-glass countdown-glass">
					{selection ? (
						<p
							className="painting-countdown"
							role="timer"
							aria-label={`次の生成まで残り${remaining.hours}時間${remaining.minutes}分`}
						>
							<Clock3 size={17} aria-hidden="true" />
							<span>次の生成まで</span>
							<span className="countdown-value">
								{remaining.hours}
								<span>時間</span>
								{String(remaining.minutes).padStart(2, "0")}
								<span>分</span>
							</span>
						</p>
					) : (
						<output className="painting-countdown">
							<CheckCircle2 size={17} aria-hidden="true" />
							<span>
								{!historyReady
									? "確認しています…"
									: stage !== "idle"
										? "生成中です…"
										: "生成できます"}
							</span>
						</output>
					)}
				</div>
			</div>
			{stage !== "idle" && <GenerationLoading stage={stage} />}
			{openedSelection && (
				<Suspense fallback={<GenerationLoading stage="artwork" />}>
					<ArtworkModal
						selection={openedSelection}
						onClose={() => setOpenedSelection(null)}
					/>
				</Suspense>
			)}
		</main>
	);
}
