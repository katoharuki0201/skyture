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
				今いる場所の天気と時間に合わせて、
				<br />
				ぴったりの絵画を一枚おすすめします。
			</p>
			<div className="today-actions">
				<button type="button" className="painting-button" aria-disabled="true">
					<span>今日の一枚に出会う</span>
					<ArrowRight size={22} aria-hidden="true" />
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
			</div>
		</main>
	);
}
