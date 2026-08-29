/* トップページ：食レポ一覧のカード描画 */
(async function () {
  const grid = document.getElementById("report-grid");
  if (!grid) return;

  try {
    const reports = await loadReports();

    if (reports.length === 0) {
      grid.innerHTML = `<p class="empty-state">まだ食レポがありません。近日公開をお待ちください。</p>`;
      return;
    }

    grid.innerHTML = reports
      .map(
        (r) => `
      <a class="report-card" href="article.html?slug=${encodeURIComponent(r.slug)}">
        <div class="thumb">
          <span class="date-pill">${formatDateJP(r.visitDate)}</span>
          <img src="${escapeHtml(r.photo)}" alt="${escapeHtml(r.shopName)}" loading="lazy" />
        </div>
        <div class="body">
          <span class="area">${escapeHtml(r.area || "")}</span>
          <h3>${escapeHtml(r.title)}</h3>
          <span class="shop">${escapeHtml(r.shopName)}</span>
          <p class="excerpt">${escapeHtml(r.excerpt)}</p>
          <span class="more">続きを読む</span>
        </div>
      </a>`
      )
      .join("");
  } catch (e) {
    grid.innerHTML = `<p class="empty-state">記事の読み込みに失敗しました。時間をおいて再度お試しください。</p>`;
    console.error(e);
  }
})();
