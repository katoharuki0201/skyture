import { isHTTPError, isNetworkError, isTimeoutError } from "ky";

export type WeatherErrorCode =
	| "timeout"
	| "network"
	| "rate-limit"
	| "http"
	| "data"
	| "classification"
	| "unknown";
export class WeatherError extends Error {
	constructor(
		public readonly code: WeatherErrorCode,
		message: string,
		options?: ErrorOptions,
	) {
		super(message, options);
		this.name = "WeatherError";
	}
}

export function weatherError(cause: unknown): WeatherError {
	if (cause instanceof WeatherError) return cause;
	if (isTimeoutError(cause))
		return new WeatherError(
			"timeout",
			"天気情報の取得がタイムアウトしました。時間をおいて再試行してください。",
			{ cause },
		);
	if (isNetworkError(cause))
		return new WeatherError(
			"network",
			"天気サービスに接続できませんでした。通信環境やブラウザの接続制限を確認して再試行してください。",
			{ cause },
		);
	if (isHTTPError(cause)) {
		const status = cause.response.status;
		return new WeatherError(
			status === 429 ? "rate-limit" : "http",
			status === 429
				? "天気サービスのアクセス制限に達しました（HTTP 429）。時間をおいて再試行してください。"
				: `天気サービスからエラーが返されました（HTTP ${status}）。${status >= 500 || status === 408 ? "時間をおいて再試行してください。" : "リクエストが受け付けられませんでした。"}`,
			{ cause },
		);
	}
	if (cause instanceof SyntaxError)
		return new WeatherError(
			"data",
			"天気サービスの応答を読み取れませんでした。時間をおいて再試行してください。",
			{ cause },
		);
	return new WeatherError(
		"unknown",
		"天気情報の処理中に予期しないエラーが発生しました。再試行してください。",
		{ cause },
	);
}

const retryStatuses = [408, 429, 500, 502, 503, 504];
function retryAfter(error: unknown): number | undefined {
	if (!isHTTPError(error)) return;
	const value = error.response.headers.get("Retry-After");
	if (!value?.trim()) return;
	const seconds = Number(value);
	const delay = Number.isFinite(seconds)
		? seconds * 1000
		: Date.parse(value) - Date.now();
	return Number.isFinite(delay) ? Math.max(0, delay) : undefined;
}

export async function retryWeatherRequest<T>(
	request: () => Promise<T>,
	wait: (ms: number) => Promise<void> = (ms) =>
		new Promise((resolve) => setTimeout(resolve, ms)),
): Promise<T> {
	for (let attempt = 0; ; attempt++) {
		try {
			return await request();
		} catch (cause) {
			const retryable =
				isNetworkError(cause) ||
				isTimeoutError(cause) ||
				(isHTTPError(cause) && retryStatuses.includes(cause.response.status));
			const delay = retryAfter(cause) ?? 1000 * 2 ** attempt;
			if (!retryable || attempt >= 2 || delay > 15_000)
				throw weatherError(cause);
			await wait(delay);
		}
	}
}
