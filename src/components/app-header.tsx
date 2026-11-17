import { LiquiGlass } from "@liqui-design/glass";
import { Earth, Images, Info, Sun, X } from "lucide-react";
import { useRef } from "react";

const features = [
	{
		icon: Sun,
		name: "今日の絵画",
		description: "今いる場所の天気と時間帯に合う絵画に出会えます。",
	},
	{
		icon: Images,
		name: "ギャラリー",
		description: "これまでに出会った作品を振り返ることができます。",
	},
	{
		icon: Earth,
		name: "地球儀",
		description:
			"世界の主要都市の空に合う絵画を、3Dの地球儀でめぐります。作品は1日1回更新されます。",
	},
];

export function AppHeader() {
	const dialogRef = useRef<HTMLDialogElement>(null);

	return (
		<>
			<header className="app-header">
				<div className="app-brand">
					<img
						className="app-brand-image"
						src={`${import.meta.env.BASE_URL}images/palette.png`}
						alt=""
						width={50}
						height={50}
					/>
					<span>Skyture</span>
				</div>
				<button
					type="button"
					className="app-info-button"
					aria-label="Skytureについて"
					aria-haspopup="dialog"
					onClick={() => dialogRef.current?.showModal()}
				>
					<Info size={26} strokeWidth={1.7} aria-hidden="true" />
				</button>
			</header>
			<dialog
				ref={dialogRef}
				className="about-dialog"
				aria-labelledby="about-title"
				aria-describedby="about-description"
			>
				<LiquiGlass radius={28} frost={0.8} className="about-glass">
					<div className="about-content">
						<form method="dialog" className="about-close-form">
							<button
								type="submit"
								className="about-close-button"
								aria-label="説明を閉じる"
							>
								<X size={22} aria-hidden="true" />
							</button>
						</form>
						<img
							className="about-brand-image"
							src={`${import.meta.env.BASE_URL}images/palette.png`}
							alt=""
							width={64}
							height={64}
						/>
						<h2 id="about-title">Skyture</h2>
						<p id="about-description">
							空を見上げるように、絵画と出会う。
							<br />
							天気と時間帯から、その空に合う美術作品を届けます。
						</p>
						<ul className="about-features">
							{features.map(({ icon: Icon, name, description }) => (
								<li key={name}>
									<Icon size={23} aria-hidden="true" />
									<div>
										<h3>{name}</h3>
										<p>{description}</p>
									</div>
								</li>
							))}
						</ul>
					</div>
				</LiquiGlass>
			</dialog>
		</>
	);
}
