/* 記事詳細ページ：?slug= に対応する記事を reports.json から探して描画 */
(async function () {
  const root = document.getElementById("article-root");
  if (!root) return;

  const slug = getQueryParam("slug");

  try {
    const reports = await loadReports();
    const report = reports.find((r) => r.slug === slug);

    if (!report) {
      root.innerHTML = `
        <div class="empty-state">
          <p>指定された食レポが見つかりませんでした。</p>
          <p><a href="index.html" class="btn btn-solid" style="margin-top:12px;">トップへ戻る</a></p>
        </div>`;
      document.title = "記事が見つかりません｜グルメ司法書士のレストランナビ";
      return;
    }

    document.title = `${report.title}｜グルメ司法書士のレストランナビ`;

    const mapSrc = report.mapEmbedUrl
      ? report.mapEmbedUrl
      : `https://www.google.com/maps?q=${encodeURIComponent(report.mapQuery || report.shopName)}&output=embed`;

    const reviewParagraphs = (Array.isArray(report.review) ? report.review : [String(report.review)])
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join("");

    // 複数写真がある場合はギャラリー表示、なければ単一写真を表示
    const gallery = Array.isArray(report.photos) && report.photos.length > 0 ? report.photos : null;

    const photoHtml = gallery
      ? `
      <div class="article-photo">
        <img src="${escapeHtml(gallery[0].url)}" alt="${escapeHtml(gallery[0].caption || report.shopName)}" loading="eager" />
      </div>
      ${
        gallery.length > 1
          ? `<div class="photo-gallery">
              ${gallery
                .slice(1)
                .map(
                  (p) => `
                <figure>
                  <img src="${escapeHtml(p.url)}" alt="${escapeHtml(p.caption || report.shopName)}" loading="lazy" />
                  ${p.caption ? `<figcaption>${escapeHtml(p.caption)}</figcaption>` : ""}
                </figure>`
                )
                .join("")}
            </div>`
          : ""
      }`
      : `
      <div class="article-photo">
        <img src="${escapeHtml(report.photo)}" alt="${escapeHtml(report.shopName)}" loading="eager" />
      </div>`;

    root.innerHTML = `
      <nav class="breadcrumb">
        <a href="index.html">トップ</a> ／ <a href="index.html#reports">食レポ一覧</a> ／ ${escapeHtml(report.shopName)}
      </nav>

      <header class="article-header">
        <span class="area-pill">${escapeHtml(report.area || "")}</span>
        <h1>${escapeHtml(report.title)}</h1>
        <div class="meta-row">
          <span class="meta-item">📅 訪問日：<b>${formatDateJP(report.visitDate)}</b></span>
          <span class="meta-item">🏮 店舗名：<b>${escapeHtml(report.shopName)}</b></span>
        </div>
      </header>

      ${photoHtml}

      <section class="review-block">
        <div class="label">
          <span class="icon">🍴</span>
          <span>グルメ司法書士の本気コメント</span>
        </div>
        ${reviewParagraphs}
      </section>

      <section class="map-block">
        <h2>📍 お店の場所</h2>
        <div class="map-frame">
          <iframe
            src="${mapSrc}"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            title="${escapeHtml(report.shopName)}の地図"
          ></iframe>
        </div>
      </section>

      <section class="cta-block">
        <div class="txt">
          <h3>気になったら、まずは公式サイトをチェック</h3>
          <p>予約状況・営業時間は変更される場合があります。訪問前に公式情報をご確認ください。</p>
        </div>
        <a class="btn btn-primary" href="${escapeHtml(report.officialUrl)}" target="_blank" rel="noopener noreferrer">
          公式サイト・予約ページへ ↗
        </a>
      </section>

      <div class="next-nav">
        <a href="index.html#reports" class="btn btn-outline-nav">← 食レポ一覧に戻る</a>
      </div>
    `;
  } catch (e) {
    root.innerHTML = `<p class="empty-state">記事の読み込みに失敗しました。時間をおいて再度お試しください。</p>`;
    console.error(e);
  }
})();
