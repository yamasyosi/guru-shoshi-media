# 交通事故示談交渉の教科書

交通事故（人身事故）の被害者向け、保険会社との示談交渉ガイドサイト。
依存パッケージなしの静的サイトジェネレーター（`build.js`）で HTML を生成する。

## 構成

```
jiko-kyoukasho/
├── site.config.json   ★事務所名・電話・URLなど（公開前に必ず差し替え）
├── build.js           ビルドスクリプト（node build.js）
├── vercel.json        Vercel 設定（build: node build.js / output: public）
├── src/
│   ├── style.css      共通CSS（ビルド時に各ページへインライン化）
│   └── pages/*.html   各ページ本文。先頭の <!--meta {JSON} --> でタイトル・FAQ等を指定
└── public/            生成物（コミット済み・デプロイ対象）
```

| URL | ページ | 役割 |
|---|---|---|
| `/` | トップ | 保険会社の「からくり」を訴求して、各ページと相談へ誘導 |
| `/karakuri/` | 増額のからくり | 一括対応→自賠責回収の構造、訴訟リスク、計算例 |
| `/kijun/` | 3つの基準 | 慰謝料・休業損害の比較表、任意保険基準で提示される理由 |
| `/chiryou/` | 治療中の過ごし方 | 通院ルール、整骨院、治療費打ち切りへの対応、後遺障害申請 |
| `/tokuyaku/` | **弁護士費用特約【特集】** | 専用デザインの特集ページ |
| `/hani/` | 司法書士に頼める範囲 | 140万円の上限と、弁護士との使い分け |
| `/soudan/` | 無料相談の流れ | 問い合わせ先・用意する書類 |

## コアウェブバイタル対策

| 指標 | 対策 |
|---|---|
| LCP | CSSをインライン化し、外部フォント・画像・JSなし（1ページ＝1リクエスト） |
| CLS | 画像なし。グラフはCSSで描画。フォントの差し替えも発生しない |
| INP | JavaScriptゼロ（スマホのメニューは `<details>` で実装） |

その他：canonical、OGP、構造化データ（WebSite / LegalService / BreadcrumbList / Article / FAQPage）、sitemap.xml と robots.txt を自動生成。

## 公開手順

1. `site.config.json` の `siteUrl`・`officeName`・`author`・`tel`・`email` を本番の値に変更する
2. `og.png`（1200×630）を `public/` に置く（またはビルド後にコピーする）
3. `node build.js`
4. Vercel で新しいプロジェクトを作り、**Root Directory を `jiko-kyoukasho`** に設定する

## 記事を追加するには

`src/pages/` に HTML ファイルを追加し、先頭に meta ブロックを書く：

```html
<!--meta
{ "path": "/kashitsu/", "type": "article", "title": "…", "crumb": "…", "description": "…",
  "faq": [{"q": "…", "a": "…"}] }
-->
<div class="wrap"><div class="text"> …本文… </div></div>
```
ナビゲーションに出す場合は、`build.js` の `NAV` にも追加する。

## 公開前に確認すること（内容面）

- 金額は2020年4月1日以降の事故の自賠責基準と、赤い本の目安で記載している。最新版の赤い本と照合すること
- 弁護士費用特約の補償内容（300万円・10万円・司法書士が対象かどうか）は、保険会社の一般的な例として記載している
- 司法書士の広告ルール（品位を保つこと、結果を保証しないこと）に沿って表現しているか、所属する司法書士会の規程で最終確認すること
