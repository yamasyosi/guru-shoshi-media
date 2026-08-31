/* ============================================================
   グルメ司法書士の極上レストランナビ - 共通ユーティリティ
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
