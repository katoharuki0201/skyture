import { useEffect, useRef, useState } from "react";
import { localDateKey } from "../lib/local-date";
import { loadWorldDay, type WorldDay } from "../lib/world-artworks";

export function useWorldArtworks() {
	const [snapshot, setSnapshot] = useState<WorldDay | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const refresh = useRef<() => void>(() => {});
	useEffect(() => {
		let active = true;
		const controller = new AbortController();
		let fetching = false;
		let loadedDate = "";
		const load = async () => {
			if (fetching) return;
			fetching = true;
			const date = localDateKey(new Date());
			setLoading(true);
			setError("");
			try {
				const result = await loadWorldDay((result) => {
					if (active && result.date === localDateKey(new Date()))
						setSnapshot(result);
				}, controller.signal);
				if (active) {
					loadedDate = date;
					if (date === localDateKey(new Date())) setSnapshot(result);
				}
			} catch {
				if (active) {
					setError(
						"都市の作品データを保存・読み込みできません。ブラウザのストレージ設定を確認してください。",
					);
					loadedDate = date;
				}
			} finally {
				fetching = false;
				if (active) setLoading(false);
			}
		};
		refresh.current = () => {
			void load();
		};
		const checkDate = () => {
			if (loadedDate && loadedDate !== localDateKey(new Date())) {
				setSnapshot(null);
				void load();
			}
		};
		void load();
		const timer = window.setInterval(checkDate, 1000);
		window.addEventListener("focus", checkDate);
		return () => {
			active = false;
			controller.abort();
			clearInterval(timer);
			window.removeEventListener("focus", checkDate);
		};
	}, []);
	return { snapshot, loading, error, retry: () => refresh.current() };
}
