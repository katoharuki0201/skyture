import { LiquiGlass } from "@liqui-design/glass";
import { Link } from "@tanstack/react-router";
import { Earth, Images, Sun } from "lucide-react";

const pages = [
	{ to: "/", label: "今日の絵画", icon: Sun },
	{ to: "/gallery", label: "ギャラリー", icon: Images },
	{ to: "/globe", label: "地球儀", icon: Earth },
] as const;

export function PageNavigation() {
	return (
		<nav className="page-navigation" aria-label="メインナビゲーション">
			<LiquiGlass
				className="navigation-glass"
				radius={35}
				bezel={14}
				frost={0.16}
				elevated
			>
				<div className="navigation-items">
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
			</LiquiGlass>
		</nav>
	);
}
