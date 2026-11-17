import { afterEach, describe, expect, test } from "bun:test";
import { classifyWeather, classifyTime, pickArtwork, localDateKey, readToday, saveSelection } from "../src/lib/artwork-selection.ts";

const originalStorage = globalThis.localStorage;
afterEach(() => { globalThis.localStorage = originalStorage; });

describe("天気・時間帯の判定", () => {
  test("WMOコードを5分類へ対応付ける", () => {
    for (const code of [0, 1]) expect(classifyWeather(code)).toBe("clear");
    for (const code of [2, 3, 45, 48]) expect(classifyWeather(code)).toBe("cloudy");
    for (const code of [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]) expect(classifyWeather(code)).toBe("rain");
    for (const code of [71, 73, 75, 77, 85, 86]) expect(classifyWeather(code)).toBe("snow");
    for (const code of [95, 96, 99]) expect(classifyWeather(code)).toBe("storm");
    expect(() => classifyWeather(999)).toThrow();
  });
  test("日の出・日の入りの前後1時間を含む境界", () => {
    expect(classifyTime(6400, 10000, 50000, 0)).toBe("twilight");
    expect(classifyTime(13600, 10000, 50000, 1)).toBe("twilight");
    expect(classifyTime(13601, 10000, 50000, 1)).toBe("day");
    expect(classifyTime(53600, 10000, 50000, 0)).toBe("twilight");
    expect(classifyTime(53601, 10000, 50000, 0)).toBe("night");
    expect(classifyTime(20000, null, null, 1)).toBe("day");
    expect(classifyTime(20000, null, null, 0)).toBe("night");
  });
});

test("両条件の一致を優先し、不一致なら全作品を候補にする", () => {
  expect(pickArtwork({ weather: "clear", time: "day" }, () => 0).artwork.id).toBe("met-11181");
  expect(pickArtwork({ weather: "cloudy", time: "day" }, () => 0).fallback).toBe(false);
  const conditions = { weather: "storm", time: "night" };
  expect(pickArtwork(conditions, () => 0).artwork.id).toBe("met-10181");
  expect(pickArtwork(conditions, () => 0.999).artwork.id).toBe("met-11181");
  expect(pickArtwork(conditions).fallback).toBe(true);
});

test("端末の日付が切り替わると別日になる", () => {
  expect(localDateKey(new Date(2026, 10, 17, 23, 59))).not.toBe(localDateKey(new Date(2026, 10, 18, 0, 0)));
});

test("履歴保存・当日復元・同日再出力の防止", () => {
  const memory = new Map();
  globalThis.localStorage = { getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
  const conditions = { weather: "clear", time: "day", temperature: 21 };
  const first = { ...pickArtwork(conditions), conditions, generatedAt: new Date().toISOString() };
  saveSelection(first);
  expect(readToday()).toEqual(first);
  const other = { ...first, artwork: pickArtwork({ weather: "cloudy", time: "day" }).artwork };
  expect(saveSelection(other)).toEqual(first);
  expect(JSON.parse([...memory.values()][0])).toHaveLength(1);
});

test("天気APIへ座標を渡し、レスポンスから選定条件を作る", async () => {
  const { fetchConditions } = await import("../src/lib/artwork-selection.ts");
  const originalFetch = globalThis.fetch;
  let requested;
  globalThis.fetch = async (request) => {
    requested = new URL(request.url);
    return new Response(JSON.stringify({
      current: { time: 20000, weather_code: 61, temperature_2m: 18.5, is_day: 1 },
      daily: { sunrise: [10000], sunset: [50000] },
    }), { headers: { "content-type": "application/json" } });
  };
  try {
    const result = await fetchConditions({ latitude: 35, longitude: 139 });
    expect(requested.searchParams.get("latitude")).toBe("35");
    expect(requested.searchParams.get("longitude")).toBe("139");
    expect(requested.searchParams.get("timeformat")).toBe("unixtime");
    expect(result).toEqual({ weather: "rain", time: "day", temperature: 18.5 });
  } finally { globalThis.fetch = originalFetch; }
});

test("再出力許可時は同日の作品も新しく保存し最新を復元する", () => {
  const memory = new Map();
  globalThis.localStorage = { getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
  const conditions = { weather: "clear", time: "day", temperature: 21 };
  const first = { ...pickArtwork(conditions), conditions, generatedAt: new Date().toISOString() };
  saveSelection(first);
  const second = { ...first, artwork: pickArtwork({ weather: "cloudy", time: "day" }).artwork };
  expect(saveSelection(second, { allowRepeat: true })).toEqual(second);
  expect(readToday()).toEqual(second);
  expect(JSON.parse([...memory.values()][0])).toHaveLength(2);
});
