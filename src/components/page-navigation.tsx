import { Link, useLocation } from "@tanstack/react-router";
import { Earth, Images, Sun } from "lucide-react";

const pages = [
	{ to: "/", label: "今日の絵画", icon: Sun },
	{ to: "/gallery", label: "ギャラリー", icon: Images },
	{ to: "/globe", label: "地球儀", icon: Earth },
] as const;

export function PageNavigation() {
	const pathname = useLocation({ select: (location) => location.pathname });
	const selectedIndex = Math.max(
		0,
		pages.findIndex((page) => page.to === pathname),
	);
	return (
		<nav className="page-navigation" aria-label="メインナビゲーション">
			<div className="transparent-glass navigation-glass">
				<div className="navigation-items">
					<span
						className="navigation-indicator"
						aria-hidden="true"
						style={{ transform: `translateX(${selectedIndex * 100}%)` }}
					/>
					{pages.map(({ to, label, icon: Icon }) => (
						<Link
							key={to}
							to={to}
							className="navigation-link"
							activeProps={{ className: "is-active", "aria-current": "page" }}
							activeOptions={{ exact: true }}
						>
							<Icon size={26} strokeWidth={1.8} aria-hidden="true" />
							<span>{label}</span>
						</Link>
					))}
				</div>
			</div>
		</nav>
	);
}
