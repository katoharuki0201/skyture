import { Info } from "lucide-react";

export function AppHeader() {
	return (
		<header className="app-header">
			<span className="app-brand">Skyture</span>
			<span className="app-info-icon" role="img" aria-label="アプリの説明">
				<Info size={26} strokeWidth={1.7} aria-hidden="true" />
			</span>
		</header>
	);
}
