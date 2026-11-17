import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Clock3 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	fetchConditions,
	pickArtwork,
	readToday,
	type Selection,
	saveSelection,
	timeLabels,
	weatherLabels,
} from "../lib/artwork-selection";
import { getCurrentLocation } from "../lib/location";

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
	const [imageFailed, setImageFailed] = useState(false);
	const [imageAttempt, setImageAttempt] = useState(0);
	const inFlight = useRef(false);

	async function generate() {
		if (inFlight.current || selection) return;
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
			let conditions: Awaited<ReturnType<typeof fetchConditions>>;
			try {
				conditions = await fetchConditions(coords);
			} catch {
				throw new Error(
					"天気情報を取得できませんでした。通信環境を確認して再試行してください。",
				);
			}
			const picked = pickArtwork(conditions);
			const result = saveSelection({
				...picked,
				conditions,
				generatedAt: new Date().toISOString(),
			});
			setImageFailed(false);
			setSelection(result);
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
			{selection && (
				<section className="artwork-result" aria-label="今日の作品">
					<p className="artwork-weather">
						{weatherLabels[selection.conditions.weather]} ·{" "}
						{timeLabels[selection.conditions.time]} ·{" "}
						{selection.conditions.temperature.toFixed(1)}°C
					</p>
					{imageFailed ? (
						<div className="artwork-image-error" role="alert">
							<p>作品画像を読み込めませんでした。</p>
							<button
								type="button"
								onClick={() => {
									setImageFailed(false);
									setImageAttempt((value) => value + 1);
								}}
							>
								画像を再読み込み
							</button>
						</div>
					) : (
						<img
							key={`${selection.generatedAt}-${imageAttempt}`}
							className="artwork-image"
							src={selection.artwork.image}
							alt={`${selection.artwork.title} — ${selection.artwork.artist}`}
							onError={() => setImageFailed(true)}
						/>
					)}
					<h1>{selection.artwork.title}</h1>
					<p>
						{selection.artwork.artist} · {selection.artwork.date}
					</p>
					<a href={selection.artwork.link} target="_blank" rel="noreferrer">
						The Metropolitan Museum of Artで作品を見る ↗
					</a>
					{selection.fallback && (
						<p className="artwork-note">
							今の空に一致する作品がないため、コレクション全体から選びました。
						</p>
					)}
				</section>
			)}
			{error && (
				<p className="generation-error" role="alert">
					{error}
				</p>
			)}
			<div className="today-actions">
				<button
					type="button"
					className="painting-button"
					disabled={stage !== "idle" || !!selection}
					onClick={generate}
				>
					<span>
						{stage === "location"
							? "現在地を取得しています…"
							: stage === "weather"
								? "天気を確認しています…"
								: selection
									? "今日の一枚をお届けしました"
									: error
										? "もう一度試す"
										: "今日の一枚に出会う"}
					</span>
					{stage === "idle" && !selection && (
						<ArrowRight size={22} aria-hidden="true" />
					)}
				</button>
				<div className="transparent-glass countdown-glass">
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
				</div>
				<a
					className="weather-credit"
					href="https://open-meteo.com/"
					target="_blank"
					rel="noreferrer"
				>
					Weather data by Open-Meteo
				</a>
			</div>
		</main>
	);
}
