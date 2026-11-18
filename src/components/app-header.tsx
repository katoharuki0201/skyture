import { CalendarDays, Info, UserRoundCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDialogBackdrop } from "../lib/use-dialog-backdrop";

export function AppHeader() {
	const [open, setOpen] = useState(false);
	const backdropDismiss = useDialogBackdrop();
	const dialog = useRef<HTMLDialogElement>(null);
	useEffect(() => {
		const element = dialog.current;
		if (!element || !open) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		element.showModal();
		return () => {
			element.close();
			document.body.style.overflow = previous;
		};
	}, [open]);
	return (
		<>
			<header className="app-header">
				<img
					className="app-brand"
					src={`${import.meta.env.BASE_URL}images/skyture-art-wordmark.png`}
					alt="Skyture"
					width={2172}
					height={724}
				/>
				<button
					type="button"
					className="app-info-icon"
					aria-label="アプリについて"
					aria-haspopup="dialog"
					onClick={() => setOpen(true)}
				>
					<Info size={26} strokeWidth={1.7} aria-hidden="true" />
				</button>
			</header>
			<dialog
				{...backdropDismiss}
				ref={dialog}
				className="transparent-glass app-info-dialog"
				aria-labelledby="app-info-title"
				onClose={() => setOpen(false)}
			>
				<form method="dialog" className="app-info-close-form">
					<button
						type="submit"
						className="app-info-close"
						aria-label="説明を閉じる"
					>
						<X size={23} aria-hidden="true" />
					</button>
				</form>
				<h2 id="app-info-title">アプリについて</h2>
				<div className="app-info-item">
					<UserRoundCheck size={25} aria-hidden="true" />
					<div>
						<h3>ログイン不要</h3>
						<p>アカウントを作らずに、そのままご利用いただけます。</p>
					</div>
				</div>
				<div className="app-info-item">
					<CalendarDays size={25} aria-hidden="true" />
					<div>
						<h3>今日の絵画は1日1回まで</h3>
						<p>
							今日の絵画は1日1枚、世界の絵画は各都市につき1日1枚を取得します。端末の時間で毎日0時に更新されます。
						</p>
					</div>
				</div>
			</dialog>
		</>
	);
}
