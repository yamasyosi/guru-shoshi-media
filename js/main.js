/* ============================================================
   グルメ司法書士のレストランナビ - 共通ユーティリティ
   記事データは data/reports.json を読み込むだけで増やせます。
   新しい食レポを追加する場合は reports.json に1件オブジェクトを
   追記するだけでOK（コード変更不要）。
   ============================================================ */

const DATA_URL = "data/reports.json";

/** reports.json を読み込み、日付の新しい順に並べて返す */
async function loadReports() {
  const res = await fetch(DATA_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("記事データの読み込みに失敗しました");
  const reports = await res.json();
  return reports.slice().sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
}

/** "2026-08-15" -> "2026年8月15日" */
function formatDateJP(isoDate) {
  const d = new Date(isoDate + "T00:00:00");
  if (isNaN(d.getTime())) return isoDate;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 簡易HTMLエスケープ */
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** URLクエリパラメータ取得 */
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/**
 * 「グルメ司法書士の胃袋«登記»ランキング」の★表示HTMLを生成する。
 * rating は 0〜5 の数値（0.5刻み推奨）。未指定の記事は表示しない。
 */
function renderStars(rating) {
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  const pct = (r / 5) * 100;
  return `
    <div class="rating-block" role="img" aria-label="グルメ司法書士の胃袋登記ランキング：5点満点中${r}点">
      <span class="rating-label">グルメ司法書士の胃袋«登記»ランキング</span>
      <span class="stars" style="--rating-pct:${pct}%">★★★★★</span>
      <span class="rating-value">${r.toFixed(1)}</span>
    </div>`;
}

/* ---- モバイル用ハンバーガーメニュー ---- */
(function () {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("siteNav");
  if (!toggle || !nav) return;

  function closeNav() {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeNav));

  document.addEventListener("click", (e) => {
    if (!nav.classList.contains("open")) return;
    if (nav.contains(e.target) || toggle.contains(e.target)) return;
    closeNav();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 680) closeNav();
  });
})();

/* ---- フローティングバナー：グルメ司法書士のプロフィールへの導線（キラーン演出付き） ---- */
(function () {
  // プロフィールページ自体には出さない
  if (/profile\.html/i.test(window.location.pathname)) return;

  const banner = document.createElement("a");
  banner.href = "profile.html";
  banner.className = "profile-float-banner";
  banner.setAttribute("aria-label", "グルメ司法書士のプロフィールはこちら");
  banner.innerHTML = `
    <span class="pfb-avatar">
      <img src="images/gurushoshi-avatar.jpg" alt="" />
    </span>
    <span class="pfb-text">
      <strong>グルメ司法書士って、何者？</strong>
      <span>プロフィールはこちら ▶</span>
    </span>
    <button type="button" class="pfb-close" aria-label="バナーを閉じる">×</button>
  `;
  document.body.appendChild(banner);

  // 閉じるボタン：閉じたら以後このタブでは再表示しない
  const closeBtn = banner.querySelector(".pfb-close");
  closeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    banner.classList.remove("pfb-show");
    banner.classList.add("pfb-hide");
    try {
      sessionStorage.setItem("pfbClosed", "1");
    } catch (_) {}
  });

  let closedAlready = false;
  try {
    closedAlready = sessionStorage.getItem("pfbClosed") === "1";
  } catch (_) {}

  if (closedAlready) {
    banner.classList.add("pfb-hide");
    return;
  }

  // 登場アニメーション
  requestAnimationFrame(() => {
    requestAnimationFrame(() => banner.classList.add("pfb-show"));
  });

  // 「キラーン」光沢エフェクトを、登場後と一定間隔ごとに発動
  function playShine() {
    banner.classList.remove("pfb-shine-play");
    void banner.offsetWidth; // reflowさせてアニメーションを再始動
    banner.classList.add("pfb-shine-play");
  }
  setTimeout(playShine, 900);
  setInterval(playShine, 6000);
})();
