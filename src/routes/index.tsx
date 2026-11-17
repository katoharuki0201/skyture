import { LiquiGlass } from "@liqui-design/glass";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";

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

	useEffect(() => {
		const update = () => setRemaining(remainingUntilMidnight());
		const timer = window.setInterval(update, 1000);
		window.addEventListener("focus", update);
		return () => {
			window.clearInterval(timer);
			window.removeEventListener("focus", update);
		};
	}, []);

	return (
		<main className="today-page" aria-label="今日の絵画">
			<p className="today-introduction">
				いまの空と天気から、
				<br />
				今日の一枚をおすすめします。
			</p>
			<div className="today-actions">
				<div className="painting-button-frame">
					<button
						type="button"
						className="painting-button"
						aria-disabled="true"
					>
						<span>今日の絵を見る</span>
						<span className="painting-button-arrow">
							<ArrowRight size={24} aria-hidden="true" />
						</span>
					</button>
				</div>
				<LiquiGlass
					className="countdown-glass"
					radius={24}
					bezel={9}
					frost={0.2}
				>
					<p
						className="painting-countdown"
						role="timer"
						aria-label={`次の絵まで残り${remaining.hours}時間${remaining.minutes}分`}
					>
						<Clock3 size={17} aria-hidden="true" />
						<span>次の絵まで</span>
						<span className="countdown-value">
							{remaining.hours}
							<span>時間</span>
							{String(remaining.minutes).padStart(2, "0")}
							<span>分</span>
						</span>
					</p>
				</LiquiGlass>
			</div>
		</main>
	);
}
