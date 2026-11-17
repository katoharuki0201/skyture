export type Coordinates = {
	latitude: number;
	longitude: number;
};

export function getCurrentLocation(): Promise<Coordinates> {
	if (!navigator.geolocation) {
		return Promise.reject(
			new Error("このブラウザは位置情報に対応していません。"),
		);
	}

	return new Promise((resolve, reject) => {
		navigator.geolocation.getCurrentPosition(
			({ coords }) =>
				resolve({ latitude: coords.latitude, longitude: coords.longitude }),
			(error) => {
				const messages: Record<number, string> = {
					1: "位置情報の利用が許可されていません。ブラウザの設定で許可してから再試行してください。",
					2: "現在地を取得できませんでした。通信環境や位置情報の設定を確認してください。",
					3: "現在地の取得がタイムアウトしました。もう一度お試しください。",
				};
				reject(
					new Error(messages[error.code] ?? "現在地を取得できませんでした。"),
				);
			},
			{ timeout: 15_000, maximumAge: 0 },
		);
	});
}
