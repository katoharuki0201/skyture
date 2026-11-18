import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AnimatedBackground } from "../components/animated-background";
import { AppHeader } from "../components/app-header";
import { PageNavigation } from "../components/page-navigation";
import "../styles.css";

export const Route = createRootRoute({ component: RootComponent });
function RootComponent() {
	return (
		<div className="app-shell">
			<AnimatedBackground />
			<div className="page-content">
				<AppHeader />
				<Outlet />
			</div>
			<PageNavigation />
		</div>
	);
}
