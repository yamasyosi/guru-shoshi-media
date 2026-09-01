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
