import ky from "ky";

export const apiClient = ky.create({
	headers: {
		accept: "application/json",
	},
	// Callers own retry behavior (weather uses retryWeatherRequest).
	retry: 0,
});
