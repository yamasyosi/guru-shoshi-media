# グル書士のレストラン道

「司法書士なのに、なぜか本気で食レポする」——グルメ司法書士（グル書士）による食レポ・Webメディアです。
ビルド不要の静的サイト（HTML / CSS / Vanilla JS）として構成されており、Vercel にそのままデプロイできます。

## サイト構成

```
.
├── index.html          # トップページ（コンセプト＋食レポ一覧）
├── article.html        # 食レポ詳細ページ（?slug= で記事を出し分け）
├── profile.html         # グル書士のプロフィールページ
├── css/style.css        # 全ページ共通スタイル
├── js/
│   ├── main.js           # 共通ユーティリティ（データ読み込み・日付整形など）
│   ├── home.js           # トップページのカード一覧描画
│   └── article.js        # 記事詳細ページの描画
├── data/
│   └── reports.json      # ★食レポ記事データ（ここを編集して記事を追加）
└── vercel.json           # Vercel用の設定（クリーンURLなど）
```

## 新しい食レポを追加する方法

コードは一切触らず、`data/reports.json` に1件オブジェクトを追記するだけで
トップページの一覧・詳細ページの両方に自動で反映されます。

```json
{
  "slug": "shop-unique-id",              // URL用の一意なID（半角英数とハイフン）
  "title": "記事タイトル",
  "shopName": "お店の名前",
  "area": "エリア表記（例：東京都・神保町）",
  "visitDate": "2026-09-01",             // 訪問日（YYYY-MM-DD）
  "photo": "https://example.com/photo.jpg", // 店舗写真URL（ダミーでも可）
  "excerpt": "一覧カードに表示される短い紹介文",
  "review": [
    "本文の段落1",
    "本文の段落2",
    "本文の段落3"
  ],
  "mapQuery": "検索用の住所やお店の名前",   // Googleマップ埋め込み用（簡易指定）
  "officialUrl": "https://example.com"     // 公式サイト・予約ページのURL
}
```

- `mapQuery` の代わりに、Googleマップの「地図を埋め込む」機能で発行した iframe の
  `src` URLをそのまま `mapEmbedUrl` として指定することも可能です（APIキー不要）。
- 記事は `visitDate` の新しい順に自動で並び替えて表示されます。
- 削除したい記事は、該当オブジェクトを配列から削除するだけでOKです。

## ローカルでの確認方法

このサイトは静的ファイルのみで動作しますが、`fetch()` でJSONを読み込む都合上、
`file://` で直接開くと動作しません。簡易サーバー経由で確認してください。

```bash
node _devserver.js
# または
npx serve .
# または
vercel dev
```

> `_devserver.js` はローカル確認専用の軽量サーバーです。Vercel本番環境には影響しません。

## デプロイ

GitHubリポジトリにpushすると、VercelのGit連携により自動的にビルド・公開されます
（静的サイトのためビルドコマンドは不要です）。
