type AssetKind = "model" | "image";
const labels = { model: "額縁モデル", image: "作品画像" };
export class AssetLoadError extends Error {
	constructor(
		public readonly kind: AssetKind | "decode",
		message: string,
		options?: ErrorOptions,
	) {
		super(message, options);
		this.name = "AssetLoadError";
	}
}
function delay(ms: number, signal: AbortSignal) {
	return new Promise<void>((resolve, reject) => {
		const abort = () => {
			clearTimeout(timer);
			reject(new DOMException("Aborted", "AbortError"));
		};
		const timer = window.setTimeout(() => {
			signal.removeEventListener("abort", abort);
			resolve();
		}, ms);
		if (signal.aborted) abort();
		else signal.addEventListener("abort", abort, { once: true });
	});
}

export async function fetchAsset(
	url: string,
	kind: AssetKind,
	signal: AbortSignal,
): Promise<Response> {
	const label = labels[kind];
	for (let attempt = 0; ; attempt++) {
		try {
			let response: Response;
			try {
				response = await fetch(url, { signal });
			} catch (cause) {
				if (signal.aborted)
					throw new AssetLoadError(
						kind,
						`${label}の読み込みがタイムアウトしました。再読み込みしてください。`,
						{ cause },
					);
				if (attempt >= 2)
					throw new AssetLoadError(
						kind,
						`${label}を取得できませんでした。通信環境を確認して再読み込みしてください。`,
						{ cause },
					);
				await delay(500 * 2 ** attempt, signal);
				continue;
			}
			if (response.ok) return response;
			const retryable = [408, 429, 500, 502, 503, 504].includes(
				response.status,
			);
			if (!retryable || attempt >= 2)
				throw new AssetLoadError(
					kind,
					`${label}を取得できませんでした（HTTP ${response.status}）。再読み込みしてください。`,
				);
			const header = response.headers.get("Retry-After");
			const seconds = header ? Number(header) : Number.NaN;
			const wait = header
				? Number.isFinite(seconds)
					? seconds * 1000
					: Date.parse(header) - Date.now()
				: 500 * 2 ** attempt;
			if (wait > 15_000)
				throw new AssetLoadError(
					kind,
					`${label}の配信が混雑しています。時間をおいて再読み込みしてください。`,
				);
			await response.body?.cancel();
			await delay(Number.isFinite(wait) ? Math.max(0, wait) : 1000, signal);
		} catch (cause) {
			if (cause instanceof AssetLoadError) throw cause;
			throw new AssetLoadError(
				kind,
				`${label}の読み込みがタイムアウトしました。再読み込みしてください。`,
				{ cause },
			);
		}
	}
}
