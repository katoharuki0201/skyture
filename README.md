# Skyture

現在地や世界の都市の天気・時間帯をきっかけに、美術作品に出会うスマートフォン向けWebアプリです。最大幅は430pxで、PCでは中央に表示します。

React・TypeScript・ViteのクライアントSPAです。バックエンド、アカウント、データベースは使用しません。機能仕様は [docs/app-spec.md](docs/app-spec.md)、作業ルールは [AGENTS.md](AGENTS.md) を参照してください。

## 開発

```sh
bun install
bun run dev
```

開発サーバーは `http://localhost:3000` です。

```sh
bunx tsc --noEmit
bun run lint
bun run build
bun run preview
```

`build` は配信用の `dist` を生成します。型チェックは別コマンドです。静的ホスティングでは `/gallery`・`/globe` への直接アクセスを `index.html` に返すSPAフォールバックを設定してください。現在地取得はHTTPSまたはlocalhost環境で利用します。

## ページ

- `/`：現在地、または8都市から選択した地点の気象情報を取得し、1日1作品を保存します。
- `/gallery`：保存した作品を3D額縁で表示し、横スクロール可能な気温グラフで選択します。未記録日は線が途切れ、停止対象にはなりません。
- `/globe`：8都市の絵画をCOBEの地球儀にカードとして表示します。都市ごとの成功・失敗を逐次反映します。

額縁のタップで作品と情報面を切り替えます。世界の作品と「今日の絵画」の生成枠は別です。更新日の判定は端末の現地日付を使います。

## データと外部サービス

実行時はOpen-Meteoへ緯度・経度を送信して気象情報を取得します。美術館の作品情報は事前に `src/data/artworks.json` に用意します。美術館APIを閲覧ごとに呼ぶ構成ではありません。

現在は分類済み作品が2点です。一致候補がなければ全作品からランダムに選び、理由の説明は画面に出しません。作品の追加・分類は別途準備したデータで行います。

作品JSONは `id / title / artist / date / image / link / weather / time` を持ちます。分類は仕様書のカテゴリに揃え、画像の使用条件を確認してください。2作品の画像は `public/artworks` に保存し、`src/lib/artwork-image.ts` で元URLと対応付けています。追加作品はJSONの画像URLから読み込むため、公開先とブラウザからの取得可否を確認してください。

localStorageのキーは次のとおりです。

- `skyture.artwork-history.v1`：今日の絵画と鑑賞履歴。保存時の作品情報を持ち、選定カタログから削除された作品も表示できます。
- `skyture.world-artworks.v1`：世界の都市の当日分。履歴とは別に保存します。

データはブラウザ・配信元ごとに独立します。ブラウザのデータ削除で消え、別端末には同期されません。1日1回の制限もこの保存状態に基づきます。

## 構成

- `src/routes`：ページの構成。ルーターの生成は `src/router.tsx` に集約しています。
- `src/components`：表示と利用者の操作。
- `src/hooks`：React画面と非同期のデータ取得の接続。
- `src/data`：分類済み作品・共通の都市一覧。
- `src/lib/artwork.ts`：作品・取得条件・保存データの型と検証。
- `src/lib/weather.ts` / `weather-error.ts`：気象情報の取得・分類・エラー・リトライ。
- `src/lib/artwork-selection.ts` / `artwork-history.ts`：作品の選定と履歴の永続化。
- `src/lib/world-artworks.ts`：世界の当日分キャッシュ・都市ごとの取得状態。
- `src/lib/artwork-scene.ts`：額縁の3Dシーン。モデルを再利用し、作品変更時はテクスチャを交換します。
- `src/lib/artwork-information.ts` / `artwork-back.ts`：作品情報の整形と裏面の描画。
- `src/lib/globe-scene.ts` / `globe-layout.ts`：地球儀の描画・操作とカードの投影・配置。
- `src/styles.css`：共通・各画面のCSS。Tailwindは使用しません。
- `public/models/frame.glb`：額縁モデル。`Frame` と `Picture` のメッシュ構成を前提にします。
- `public/rive/background.riv`：全ページ共通のループ背景。

Three.jsとCOBEは静止中の不要な連続描画を停止し、リサイズ・操作・データ変更時に更新します。ブラウザが非表示の間も描画を停止します。
