import { Info } from "lucide-react";

export function AppHeader() {
	return (
		<header className="app-header">
			<img
				className="app-brand"
				src={`${import.meta.env.BASE_URL}images/skyture-art-wordmark.png`}
				alt="Skyture"
				width={2172}
				height={724}
			/>
			<span className="app-info-icon" role="img" aria-label="アプリの説明">
				<Info size={26} strokeWidth={1.7} aria-hidden="true" />
			</span>
		</header>
	);
}
