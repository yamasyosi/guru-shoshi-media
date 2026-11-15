#!/usr/bin/env node
/*
 * 交通事故示談交渉の教科書 — 静的サイトビルダー（依存パッケージなし）
 *   node build.js           → public/ を生成
 *   SITE_URL=https://... node build.js でURLを上書き可能
 *
 * src/pages/*.html の先頭に <!--meta {JSON} --> を書くと、
 * 共通レイアウト（head / header / パンくず / CTA / footer / 構造化データ）で包んで出力する。
 * CSSは <style> にインライン化（外部リクエスト0でLCP・CLSを最適化）。JavaScriptは使わない。
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'public');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
if (process.env.SITE_URL) cfg.siteUrl = process.env.SITE_URL;
cfg.siteUrl = cfg.siteUrl.replace(/\/$/, '');

const NAV = [
  { href: '/karakuri/', label: '増額のからくり' },
  { href: '/kijun/', label: '3つの基準' },
  { href: '/chiryou/', label: '治療中の過ごし方' },
  { href: '/tokuyaku/', label: '弁護士費用特約' },
  { href: '/hani/', label: '司法書士に頼める範囲' },
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fill = (s) => s.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in cfg ? cfg[k] : m));
const minCss = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,>])\s*/g, '$1').replace(/;}/g, '}').trim();
const CSS = minCss(fs.readFileSync(path.join(SRC, 'style.css'), 'utf8'));

function parse(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const m = raw.match(/^<!--meta\s*([\s\S]*?)-->\s*/);
  if (!m) throw new Error(`meta block missing: ${file}`);
  return { meta: JSON.parse(m[1]), body: raw.slice(m[0].length) };
}

function jsonLd(meta, url) {
  const graph = [];
  const org = { '@type': 'LegalService', '@id': `${cfg.siteUrl}/#office`, name: cfg.officeName, url: `${cfg.siteUrl}/`, telephone: cfg.tel, areaServed: 'JP' };
  if (meta.path === '/') {
    graph.push({ '@type': 'WebSite', '@id': `${cfg.siteUrl}/#website`, name: cfg.siteName, url: `${cfg.siteUrl}/`, inLanguage: 'ja', publisher: { '@id': org['@id'] } }, org);
  } else {
    const items = [{ name: 'ホーム', item: `${cfg.siteUrl}/` }];
    if (meta.parent) items.push({ name: meta.parent.label, item: cfg.siteUrl + meta.parent.href });
    items.push({ name: meta.crumb || meta.title, item: url });
    graph.push({ '@type': 'BreadcrumbList', itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.item })) });
    if (meta.type === 'article') {
      graph.push({
        '@type': 'Article', headline: meta.h1 || meta.title, description: meta.description, inLanguage: 'ja',
        datePublished: meta.published || cfg.updated, dateModified: meta.updated || cfg.updated,
        author: { '@type': 'Person', name: cfg.author }, publisher: org, mainEntityOfPage: url,
      });
    }
  }
  if (meta.faq && meta.faq.length) {
    graph.push({ '@type': 'FAQPage', mainEntity: meta.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') } })) });
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}

function header(current) {
  const links = NAV.map((n) => `<a href="${n.href}"${n.href === current ? ' aria-current="page"' : ''}>${n.label}</a>`).join('');
  return `<header class="hd"><div class="wrap hd-in">
<a class="logo" href="/"><span class="logo-mark" aria-hidden="true">示</span><span>${esc(cfg.siteName)}<small>${esc(cfg.siteTagline)}</small></span></a>
<nav class="nav" aria-label="メインメニュー">${links}<a class="cta-mini" href="/soudan/">無料相談</a></nav>
<details class="menu"><summary aria-label="メニューを開く">☰ メニュー</summary><div class="menu-list">${links}<a href="/soudan/">無料相談の流れ</a></div></details>
</div></header>`;
}

function breadcrumb(meta) {
  if (meta.path === '/' || meta.path === '/404') return '';
  const parts = ['<li><a href="/">ホーム</a></li>'];
  if (meta.parent) parts.push(`<li><a href="${meta.parent.href}">${esc(meta.parent.label)}</a></li>`);
  parts.push(`<li aria-current="page">${esc(meta.crumb || meta.title)}</li>`);
  return `<nav class="bc wrap" aria-label="パンくずリスト"><ol>${parts.join('')}</ol></nav>`;
}

function faqHtml(faq) {
  if (!faq || !faq.length) return '';
  return `<section class="faq" aria-labelledby="faq"><h2 id="faq">よくある質問</h2>${faq.map((f) => `<details><summary>${esc(f.q)}</summary><div class="a"><p>${f.a}</p></div></details>`).join('')}</section>`;
}

const CTA = () => `<aside class="cta" aria-label="無料相談のご案内">
<h2>示談書にサインする前に、一度だけ専門家に金額を確認させてください</h2>
<p>保険会社の提示額が「裁判基準」と比べていくら低いのか、無料で試算します。</p>
<ul class="badges"><li>相談無料</li><li>弁護士費用特約が使えます</li><li>示談書の提示額チェック</li><li>全国対応（オンライン可）</li></ul>
<div class="btns"><a class="btn btn-accent" href="/soudan/">無料相談の流れを見る</a><a class="btn btn-ghost" href="tel:${esc(cfg.tel.replace(/-/g, ''))}">電話で相談する</a></div>
<p class="tel">${esc(cfg.officeName)}｜TEL ${esc(cfg.tel)}（${esc(cfg.telHours)}）</p>
</aside>`;

function footer() {
  return `<footer class="ft"><div class="wrap">
<div class="ft-grid">
<div><h3>${esc(cfg.siteName)}</h3><p>${esc(cfg.siteTagline)}</p><p>運営：${esc(cfg.officeName)}</p></div>
<div><h3>基礎知識</h3><ul><li><a href="/karakuri/">弁護士・司法書士が入ると増額するからくり</a></li><li><a href="/kijun/">自賠責・任意保険・裁判基準の違い</a></li><li><a href="/chiryou/">治療中の過ごし方</a></li></ul></div>
<div><h3>保険・依頼</h3><ul><li><a href="/tokuyaku/">弁護士費用特約の完全ガイド</a></li><li><a href="/hani/">司法書士に頼める範囲（140万円）</a></li><li><a href="/soudan/">無料相談の流れ</a></li></ul></div>
</div>
<p class="disc">本サイトは交通事故（人身事故）の民事上の損害賠償・示談交渉に関する一般的な情報提供を目的としています。金額は主に2020年4月1日以降に発生した事故を前提とした目安であり、個別の事案での結果を保証するものではありません。認定司法書士が代理できるのは、1件の請求額が140万円以下の民事紛争に限られます（司法書士法3条1項6号・7号）。140万円を超える事案は弁護士へのご依頼が必要です。<br>© ${esc(cfg.officeName)}</p>
</div></footer>`;
}

function render(meta, body) {
  const url = meta.path === '/404' ? `${cfg.siteUrl}/404` : cfg.siteUrl + meta.path;
  const title = meta.path === '/' ? `${cfg.siteName}｜${cfg.siteTagline}` : `${meta.title}｜${cfg.siteName}`;
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(meta.description)}">
${meta.path === '/404' ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${esc(url)}">`}
<meta name="theme-color" content="#12335b">
<meta property="og:type" content="${meta.path === '/' ? 'website' : 'article'}">
<meta property="og:site_name" content="${esc(cfg.siteName)}">
<meta property="og:title" content="${esc(meta.title)}">
<meta property="og:description" content="${esc(meta.description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(cfg.siteUrl)}/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>${CSS}</style>
<script type="application/ld+json">${jsonLd(meta, url)}</script>
</head>
<body>
<a class="skip" href="#main">本文へスキップ</a>
${header(meta.path)}
${breadcrumb(meta)}
<main id="main">
${fill(body)}
${meta.faq ? `<div class="wrap"><div class="text">${faqHtml(meta.faq)}</div></div>` : ''}
${meta.noCta ? '' : `<div class="wrap"><div class="text">${CTA()}</div></div>`}
</main>
${footer()}
</body>
</html>
`;
}

// ---- build ----
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const pages = fs.readdirSync(path.join(SRC, 'pages')).filter((f) => f.endsWith('.html')).sort();
const sitemap = [];
for (const f of pages) {
  const { meta, body } = parse(path.join(SRC, 'pages', f));
  const html = render(meta, body);
  const dest = meta.path === '/404' ? path.join(OUT, '404.html') : path.join(OUT, meta.path, 'index.html');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
  if (meta.path !== '/404') sitemap.push({ loc: cfg.siteUrl + meta.path, lastmod: meta.updated || cfg.updated, pri: meta.path === '/' ? '1.0' : meta.special ? '0.9' : '0.8' });
  console.log(`✔ ${meta.path.padEnd(12)} ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`);
}
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.map((s) => `  <url><loc>${s.loc}</loc><lastmod>${s.lastmod}</lastmod><priority>${s.pri}</priority></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${cfg.siteUrl}/sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#12335b"/><text x="32" y="44" font-size="34" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="700">示</text></svg>');
console.log(`\n${pages.length} pages → ${path.relative(process.cwd(), OUT) || OUT}`);
