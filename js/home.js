/* トップページ：食レポ一覧のカード描画 ＋ エリア（都道府県・市区町村）絞り込み */
(async function () {
  const grid = document.getElementById("report-grid");
  if (!grid) return;

  const prefRow = document.getElementById("areaFilterPrefectures");
  const wardRow = document.getElementById("areaFilterWards");
  const clearBtn = document.getElementById("areaFilterClear");
  const countLabel = document.getElementById("areaFilterCount");

  let allReports = [];
  let activePref = null; // null = すべて
  let activeWard = null; // null = そのprefecture内すべて

  function cardHtml(r) {
    return `
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
      </a>`;
  }

  function renderGrid(list) {
    if (list.length === 0) {
      grid.innerHTML = `<p class="empty-state">該当するエリアの食レポはまだありません。</p>`;
      return;
    }
    grid.innerHTML = list.map(cardHtml).join("");
  }

  /** reports から {都道府県: {市区町村: 件数}} の集計マスターを動的に作る */
  function buildAreaIndex(reports) {
    const index = new Map(); // prefecture -> Map(ward -> count)
    reports.forEach((r) => {
      if (!r.prefecture || !r.ward) return;
      if (!index.has(r.prefecture)) index.set(r.prefecture, new Map());
      const wardMap = index.get(r.prefecture);
      wardMap.set(r.ward, (wardMap.get(r.ward) || 0) + 1);
    });
    return index;
  }

  function applyFilter() {
    let list = allReports;
    if (activePref) {
      list = list.filter((r) => r.prefecture === activePref);
      if (activeWard) {
        list = list.filter((r) => r.ward === activeWard);
      }
    }
    renderGrid(list);

    clearBtn.hidden = !activePref;
    if (!activePref) {
      countLabel.textContent = `全 ${allReports.length} 件`;
    } else if (!activeWard) {
      countLabel.textContent = `${activePref}：${list.length} 件`;
    } else {
      countLabel.textContent = `${activePref} ${activeWard}：${list.length} 件`;
    }
  }

  function renderPrefectureRow(areaIndex) {
    const prefectures = [...areaIndex.keys()];
    const totalCount = allReports.length;

    const allBtn = `<button type="button" class="area-pill${activePref === null ? " active" : ""}" data-pref="">すべて <span class="area-pill-count">${totalCount}</span></button>`;

    const prefBtns = prefectures
      .map((pref) => {
        const count = [...areaIndex.get(pref).values()].reduce((a, b) => a + b, 0);
        const isActive = activePref === pref;
        return `<button type="button" class="area-pill${isActive ? " active" : ""}" data-pref="${escapeHtml(pref)}">${escapeHtml(pref)} <span class="area-pill-count">${count}</span></button>`;
      })
      .join("");

    prefRow.innerHTML = allBtn + prefBtns;
  }

  function renderWardRow(areaIndex) {
    if (!activePref || !areaIndex.has(activePref)) {
      wardRow.hidden = true;
      wardRow.innerHTML = "";
      return;
    }
    const wardMap = areaIndex.get(activePref);
    const prefTotal = [...wardMap.values()].reduce((a, b) => a + b, 0);

    const allBtn = `<button type="button" class="area-pill area-pill-sub${activeWard === null ? " active" : ""}" data-ward="">${escapeHtml(activePref)}すべて <span class="area-pill-count">${prefTotal}</span></button>`;

    const wardBtns = [...wardMap.entries()]
      .map(([ward, count]) => {
        const isActive = activeWard === ward;
        return `<button type="button" class="area-pill area-pill-sub${isActive ? " active" : ""}" data-ward="${escapeHtml(ward)}">${escapeHtml(ward)} <span class="area-pill-count">${count}</span></button>`;
      })
      .join("");

    wardRow.innerHTML = allBtn + wardBtns;
    wardRow.hidden = false;
  }

  function renderFilterUI(areaIndex) {
    renderPrefectureRow(areaIndex);
    renderWardRow(areaIndex);
  }

  try {
    allReports = await loadReports();
    const areaIndex = buildAreaIndex(allReports);

    renderFilterUI(areaIndex);
    applyFilter();

    prefRow.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-pref]");
      if (!btn) return;
      const pref = btn.dataset.pref;
      activePref = pref === "" ? null : pref;
      activeWard = null;
      renderFilterUI(areaIndex);
      applyFilter();
    });

    wardRow.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-ward]");
      if (!btn) return;
      const ward = btn.dataset.ward;
      activeWard = ward === "" ? null : ward;
      renderWardRow(areaIndex);
      applyFilter();
    });

    clearBtn.addEventListener("click", () => {
      activePref = null;
      activeWard = null;
      renderFilterUI(areaIndex);
      applyFilter();
    });
  } catch (e) {
    grid.innerHTML = `<p class="empty-state">記事の読み込みに失敗しました。時間をおいて再度お試しください。</p>`;
    console.error(e);
  }
})();

/* ---- 見出し「司法書士なのに、なぜか本気で食レポする。」：文字自体がぷるんと弾むギミック ---- */
(function () {
  const headline = document.getElementById("heroHeadline");
  if (!headline) return;

  /** テキストノードを1文字ずつ <span class="ch"> に分解し、順番にアニメ遅延をつける */
  function wrapChars(node, counter) {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        for (const ch of child.textContent) {
          const span = document.createElement("span");
          span.className = "ch";
          span.style.animationDelay = `${counter.i * 35}ms`;
          span.textContent = ch;
          counter.i += 1;
          frag.appendChild(span);
        }
        node.replaceChild(frag, child);
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== "BR") {
        wrapChars(child, counter);
      }
    });
  }
  wrapChars(headline, { i: 0 });

  /** クラスの付け外し＋reflowで、何度でも同じアニメを再生できるようにする */
  function playBounce() {
    headline.classList.remove("bounce-play");
    void headline.offsetWidth;
    headline.classList.add("bounce-play");
  }

  // サイトを開いたら（スクロール不要）、少し間を置いて自動で1回再生
  setTimeout(playBounce, 500);

  // スワイプ（横方向に一定量動かす）でも再生できるようにしておく（元のギミック）
  let startX = null;
  headline.addEventListener(
    "touchstart",
    (e) => {
      startX = e.touches[0].clientX;
    },
    { passive: true }
  );
  headline.addEventListener(
    "touchend",
    (e) => {
      if (startX == null) return;
      const dx = e.changedTouches[0].clientX - startX;
      const width = headline.getBoundingClientRect().width || 1;
      if (Math.abs(dx) / width >= 0.25) playBounce();
      startX = null;
    },
    { passive: true }
  );
})();

/* ---- リード文「独立開業する勇気はないくせに…」：スクロールで見えたらマーカーで下線が引かれるギミック ---- */
(function () {
  const phrase = document.getElementById("giveUpLine");
  const hero = document.querySelector(".hero");
  if (!phrase || !hero) return;

  /**
   * 折り返しで複数行になっても、行ごとに正しい位置へ下線を引けるよう
   * getClientRects()（1行につき1矩形）を元に実要素のバーを生成する。
   */
  function buildUnderlineBars() {
    const heroRect = hero.getBoundingClientRect();
    const lineRects = Array.from(phrase.getClientRects());
    return lineRects.map((r) => {
      const bar = document.createElement("span");
      bar.className = "marker-underline-line";
      bar.style.left = `${r.left - heroRect.left}px`;
      bar.style.top = `${r.bottom - heroRect.top - 5}px`;
      bar.style.width = "0px";
      bar.dataset.targetWidth = `${r.width}px`;
      hero.appendChild(bar);
      return bar;
    });
  }

  function playUnderline() {
    const bars = buildUnderlineBars();
    // 1行ずつ少し遅れて引かれるようにする
    bars.forEach((bar, i) => {
      setTimeout(() => {
        bar.style.width = bar.dataset.targetWidth;
      }, i * 180);
    });
  }

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            playUnderline();
            observer.unobserve(phrase); // 一度引いたら以後は再アニメーションしない
          }
        });
      },
      { threshold: 0.6 }
    );
    io.observe(phrase);
  } else {
    // IntersectionObserver未対応の古いブラウザ向けフォールバック
    playUnderline();
  }
})();
