import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: TodayPage });

function TodayPage() {
	return (
		<main className="app-page">
			<header className="page-heading">
				<p className="page-eyebrow">TODAY</p>
				<h1>今日の絵画</h1>
				<p className="page-description">今の空から、1枚の絵画へ。</p>
			</header>
		</main>
	);
}
