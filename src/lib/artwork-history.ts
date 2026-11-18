import { type Selection, selectionSchema } from "./artwork";
import { unlimitedGeneration } from "./development-options";
import { localDateKey } from "./local-date";

const storageKey = "skyture.artwork-history.v1";

export function readHistory(): Selection[] {
	const raw: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
	if (!Array.isArray(raw))
		throw new Error("保存された作品履歴を読み込めませんでした。");
	return raw.flatMap((entry) => {
		const parsed = selectionSchema.safeParse(entry);
		return parsed.success ? [parsed.data] : [];
	});
}

export function readToday(): Selection | null {
	return (
		readHistory()
			.reverse()
			.find(
				(entry) =>
					localDateKey(new Date(entry.generatedAt)) ===
					localDateKey(new Date()),
			) ?? null
	);
}

export function saveSelection(selection: Selection): Selection {
	// A second tab may already have generated today's artwork while location was loading.
	const existing = unlimitedGeneration ? null : readToday();
	if (existing) return existing;
	localStorage.setItem(
		storageKey,
		JSON.stringify([...readHistory(), selection]),
	);
	return selection;
}
