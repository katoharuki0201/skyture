
interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

/**
 * 現在地の座標を取得する
 */
function getLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    // Geolocation APIの利用可否を確認
    if (!navigator.geolocation) {
      reject(
        new Error("このブラウザは位置情報取得に対応していません。")
      );
      return;
    }

    // 現在位置を取得
    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error: GeolocationPositionError) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

export default getLocation;
