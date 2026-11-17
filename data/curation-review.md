# 作品データ 初期版18件

状態：このチャットでの利用者の採用指示に基づき、初期版18件を dist/artworks.json に確定しました。承認記録は data/reviews.json に保存しています。

Cleveland Museum of Art公式APIからCC0の絵画32件を取得し、画像を確認して18件を提案、14件を見送りました。タグはAIの画像確認に基づく提案を、利用者の採用指示により初期版へ反映しました。利用者が各画像を個別に確認したことまでは記録していません。CLIP分類は実行していません。

スキーマ、URL形式、ID重複、公式CC0表記、絵画種別、画像URLの一致、32画像のデコードを確認済み。約400枚の目安と全18組み合わせの充足は未達です。

## 組み合わせ別の件数（複数タグは重複計上）

### clear

- day: 3
- twilight: 1
- night: 2

### cloudy

- day: 5
- twilight: 0
- night: 0

### fog

- day: 2
- twilight: 0
- night: 0

### rain

- day: 1
- twilight: 0
- night: 1

### snow

- day: 2
- twilight: 0
- night: 0

### storm

- day: 4
- twilight: 0
- night: 1

## 採用作品とタグの判断根拠

各作品の公式ページで画像を確認できます。「暫定」「要確認」の記載はタグ判断の不確実性として残しています。必要に応じて今後修正してください。

### cma-106088 — Early Morning After a Storm at Sea

- 作者：Winslow Homer (American, 1836–1910)
- 制作年：1900–1903
- 天気：storm, cloudy
- 時間帯：day
- [公式作品ページ](https://clevelandart.org/art/1924.195)
- [公式画像](https://openaccess-cdn.clevelandart.org/1924.195/1924.195_web.jpg)
- 判断理由：岩に砕ける強い波と厚い雲。嵐の後の海としてstorm/cloudyを提案。早朝という題名だけではtwilightにしない。

### cma-115050 — Storm Clouds

- 作者：John Henry Twachtman (American, 1853–1902)
- 制作年：1880
- 天気：cloudy
- 時間帯：day
- [公式作品ページ](https://clevelandart.org/art/1935.217)
- [公式画像](https://openaccess-cdn.clevelandart.org/1935.217/1935.217_web.jpg)
- 判断理由：海岸上空に灰色の雲が広がる。雷や荒波は明瞭でないためstormは付けない。

### cma-126243 — A Storm Behind the Isle of Wight

- 作者：Julius Caesar Ibbetson (British, 1759–1817)
- 制作年：c.179(?)
- 天気：storm
- 時間帯：day
- [公式作品ページ](https://clevelandart.org/art/1948.461)
- [公式画像](https://openaccess-cdn.clevelandart.org/1948.461/1948.461_web.jpg)
- 判断理由：渦巻く暗雲と荒れる海。公式解説も雷と嵐を説明。暗い色だけではnightにしない。

### cma-134072 — Sunny Autumn Day

- 作者：George Inness (American, 1825–1894)
- 制作年：1892
- 天気：clear
- 時間帯：day
- [公式作品ページ](https://clevelandart.org/art/1956.578)
- [公式画像](https://openaccess-cdn.clevelandart.org/1956.578/1956.578_web.jpg)
- 判断理由：木々の間に明るい空と日差しが見える昼の風景。

### cma-139454 — Landscape

- 作者：Sōami (Japanese, d. 1525)
- 制作年：early 1500s
- 天気：fog
- 時間帯：day
- [公式作品ページ](https://clevelandart.org/art/1963.262)
- [公式画像](https://openaccess-cdn.clevelandart.org/1963.262/1963.262_web.jpg)
- 判断理由：山や水辺の輪郭を隠す帯状の霞が見える。水墨画の明るさによる昼判定は暫定で要確認。

### cma-141639 — Twilight in the Wilderness

- 作者：Frederic Edwin Church (American, 1826–1900)
- 制作年：1860
- 天気：clear
- 時間帯：twilight
- [公式作品ページ](https://clevelandart.org/art/1965.233)
- [公式画像](https://openaccess-cdn.clevelandart.org/1965.233/1965.233_web.jpg)
- 判断理由：赤く照らされた雲と明るい地平線を持つ夕景。雲の存在だけでstormにしない。

### cma-144732 — Storm in the Mountains

- 作者：Frederic Edwin Church (American, 1826–1900)
- 制作年：1847
- 天気：storm
- 時間帯：day
- [公式作品ページ](https://clevelandart.org/art/1969.52)
- [公式画像](https://openaccess-cdn.clevelandart.org/1969.52/1969.52_web.jpg)
- 判断理由：厚い暗雲、荒れた山景、折れた木が嵐を表す。昼判定は明るい雲の描写からの暫定判断。

### cma-145426 — River Village in a Rainstorm

- 作者：Lu Wenying (Chinese)
- 制作年：c. 1480–1507
- 天気：rain, storm
- 時間帯：day
- [公式作品ページ](https://clevelandart.org/art/1970.76)
- [公式画像](https://openaccess-cdn.clevelandart.org/1970.76/1970.76_web.jpg)
- 判断理由：斜めに吹き付ける雨と風にさらされる木々。公式解説も風雨を説明。時刻は暫定。

### cma-147144 — Royal lovers watching rain clouds: The month of Bhadon, from a Barahmasa

- 作者：Unknown
- 制作年：c. 1790
- 天気：rain, storm
- 時間帯：night
- [公式作品ページ](https://clevelandart.org/art/1973.104)
- [公式画像](https://openaccess-cdn.clevelandart.org/1973.104/1973.104_web.jpg)
- 判断理由：黒い雨雲と稲妻、暗い天空の宮廷風景。公式解説は嵐の夕方とするためnightとtwilightの境界は要確認。

### cma-147906 — A Prunus in the Moonlight

- 作者：Wang Mian (Chinese, 1287–1359)
- 制作年：1300s
- 天気：clear
- 時間帯：night
- [公式作品ページ](https://clevelandart.org/art/1974.26)
- [公式画像](https://openaccess-cdn.clevelandart.org/1974.26/1974.26_web.jpg)
- 判断理由：木のそばに月が見える夜景。月光の題名を補助情報として使用。曇天・雨の明瞭な描写はない。

### cma-151298 — Prater Landscape

- 作者：Ferdinand Georg Waldmüller (Austrian, 1793–1865)
- 制作年：c. 1831
- 天気：clear
- 時間帯：day
- [公式作品ページ](https://clevelandart.org/art/1983.155)
- [公式画像](https://openaccess-cdn.clevelandart.org/1983.155/1983.155_web.jpg)
- 判断理由：空が見え、草地に日差しと木陰が描かれた昼景。

### cma-152006 — Rocky, Wooded Landscape with a Dell and Weir

- 作者：Thomas Gainsborough (British, 1727–1788)
- 制作年：c. 1782–1783
- 天気：cloudy
- 時間帯：day
- [公式作品ページ](https://clevelandart.org/art/1984.59)
- [公式画像](https://openaccess-cdn.clevelandart.org/1984.59/1984.59_web.jpg)
- 判断理由：風景上空を広く覆う灰色の空。雨筋や夜を示す描写はない。

### cma-153663 — Bamboo in Moonlight

- 作者：Unknown
- 制作年：1500s
- 天気：clear
- 時間帯：night
- [公式作品ページ](https://clevelandart.org/art/1987.186)
- [公式画像](https://openaccess-cdn.clevelandart.org/1987.186/1987.186_web.jpg)
- 判断理由：竹の上に大きな満月が明瞭に見える。夜空として判断。

### cma-153664 — Snowscape with Figures

- 作者：Kim Si (Korean, 1524–1593)
- 制作年：1584
- 天気：snow
- 時間帯：day
- [公式作品ページ](https://clevelandart.org/art/1987.187)
- [公式画像](https://openaccess-cdn.clevelandart.org/1987.187/1987.187_web.jpg)
- 判断理由：雪をまとった山と木々、見通せる空。水墨画のため時刻は暫定。

### cma-159739 — Snow Landscape

- 作者：Yosa Buson (Japanese, 1716–1783)
- 制作年：mid-1770s
- 天気：snow, cloudy
- 時間帯：day
- [公式作品ページ](https://clevelandart.org/art/1997.111)
- [公式画像](https://openaccess-cdn.clevelandart.org/1997.111/1997.111_web.jpg)
- 判断理由：山や家々に積雪があり、空全体が灰色。雲と単色の空の区別は要確認。

### cma-171296 — Vale of Kashmir

- 作者：Robert S. Duncanson (American, 1821–1872)
- 制作年：1867
- 天気：clear
- 時間帯：day
- [公式作品ページ](https://clevelandart.org/art/2014.12)
- [公式画像](https://openaccess-cdn.clevelandart.org/2014.12/2014.12_web.jpg)
- 判断理由：青空と陽光が見える広い谷の風景。地平線の暖色だけではtwilightにしない。

### cma-447805 — Rain Clearing over a Summer’s Mountain

- 作者：Seifū Yohei III (Japanese, 1851–1914)
- 制作年：1893–1914
- 天気：fog
- 時間帯：day
- [公式作品ページ](https://clevelandart.org/art/2022.151)
- [公式画像](https://openaccess-cdn.clevelandart.org/2022.151/2022.151_web.jpg)
- 判断理由：山と山の間に白い霞の帯があり遠景の輪郭が薄い。雨上がりという題名だけではrainを付けない。時刻は暫定。

### cma-93014 — View of Schroon Mountain, Essex County, New York, After a Storm

- 作者：Thomas Cole (American, born England,1801–1848)
- 制作年：1838
- 天気：cloudy
- 時間帯：day
- [公式作品ページ](https://clevelandart.org/art/1917.1335)
- [公式画像](https://openaccess-cdn.clevelandart.org/1917.1335/1917.1335_web.jpg)
- 判断理由：晴れ間を残しつつ大きな雲が山を覆う。嵐の後という題名だけではstormにしない。clearとの境界は要確認。

## 見送り14件

### cma-149662 — Rain-coming Pavilion by the Stone Bridge at Mt. Tiantai

長い画巻で画像内の文字領域が大きく、天気と時刻の判定が不確実。

[公式作品ページ](https://clevelandart.org/art/1979.54)

### cma-149417 — Landscape with Gentle Peaks

山水の描写から特定の天気を判断しにくい。

[公式作品ページ](https://clevelandart.org/art/1978.7)

### cma-543409 — Bamboo in Snow

竹と岩が主で空の表現と時間帯の判定が不確実。

[公式作品ページ](https://clevelandart.org/art/2023.161)

### cma-135382 — The Red Kerchief

室内から窓越しの雪景。空が明瞭に見えないため見送り。

[公式作品ページ](https://clevelandart.org/art/1958.39)

### cma-149762 — Snow Coloring the World White

長い画巻で、画像全体から時間帯を確定しにくい。

[公式作品ページ](https://clevelandart.org/art/1979.76)

### cma-154405 — Section of an Illustrated Tale of Genji Poetry Contest

人物と詞書が主。検索語のfogは登場人物に関する説明で、霧の景色ではない。

[公式作品ページ](https://clevelandart.org/art/1989.119)

### cma-132840 — Album of Seasonal Landscapes, Leaf G (previous leaf 7)

遠景はあるが霧・曇りなどの根拠が弱い。

[公式作品ページ](https://clevelandart.org/art/1955.302.7)

### cma-148698 — Sunset over Autumn Mountains

題名は夕景だが、単色の山水から天気を確定しにくい。

[公式作品ページ](https://clevelandart.org/art/1976.151)

### cma-86110 — Sunset Glow over a Fishing Village, from Eight Views of Xiao-Xiang

題名は夕景だが、単色の山水から天気を確定しにくい。

[公式作品ページ](https://clevelandart.org/art/2015.590)

### cma-137259 — Mme L . . . (Laure Borreau)

人物肖像が主で、天気を主題とする風景としては見送り。

[公式作品ページ](https://clevelandart.org/art/1962.2)

### cma-132015 — The Poet Lin Bu Wandering in the Moonlight

月夜という題名はあるが、月・空と天気の判断が不確実。

[公式作品ページ](https://clevelandart.org/art/1954.582)

### cma-155097 — Boating in Moonlight

月夜という題名はあるが、空と天気の描写が不明瞭。

[公式作品ページ](https://clevelandart.org/art/1989.87)

### cma-160128 — Drinking in the Moonlight

月夜という題名はあるが、空と天気の描写が不明瞭。

[公式作品ページ](https://clevelandart.org/art/1997.89)

### cma-147016 — Virgin and Child in a Landscape

聖母子像が主で、天気を主題とする風景としては見送り。

[公式作品ページ](https://clevelandart.org/art/1972.47)


## 再生成について

今回の初期版は、提案データを検証して確定したものです。data/artworks.proposed.json は採用時のスナップショットとして残しています。CLIP用の data/classified.jsonl は作成していないため、現状で curation export を実行すると空配列で正式データを上書きします。再生成には今回のデータ手順を使用するか、既存の分類・レビュー工程を整えてから実行してください。
