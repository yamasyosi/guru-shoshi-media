/* ============================================================
   プロフィールページ：スクロール／スワイプで発動する演出ギミック集
   （main.js の共通ヘルパーを利用。プロフィールページのみで読み込む）
   ============================================================ */
(function () {
  /** 要素が画面に入ったら一度だけ callback を実行する */
  function onVisible(el, cb, threshold) {
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      cb();
      return;
    }
    const io = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            cb();
            observer.unobserve(el);
          }
        });
      },
      { threshold: threshold || 0.4 }
    );
    io.observe(el);
  }

  /**
   * target のテキストに沿って、行ごとに正しい位置へ線を描く実要素を生成する。
   * container は position:relative な祖先要素（座標の基準にする）。
   */
  function drawLinesAcross(target, container, opts) {
    if (!target || !container) return;
    const { colorClass = "gm-line-gold", verticalRatio = 0.92, thickness = 5, duration = 1000, stagger = 220 } = opts || {};
    const contRect = container.getBoundingClientRect();
    const rects = Array.from(target.getClientRects());
    rects.forEach((r, i) => {
      const bar = document.createElement("span");
      bar.className = `gm-draw-line ${colorClass}`;
      bar.style.height = `${thickness}px`;
      bar.style.left = `${r.left - contRect.left}px`;
      bar.style.top = `${r.top - contRect.top + r.height * verticalRatio - thickness / 2}px`;
      bar.style.width = "0px";
      container.appendChild(bar);
      setTimeout(() => {
        bar.style.transitionDuration = `${duration}ms`;
        bar.style.width = `${r.width}px`;
      }, i * stagger);
    });
  }

  /* ---- 1. プロフィール大アバター：くるっと弾んで登場 ---- */
  const avatar = document.querySelector(".profile-hero .avatar-lg");
  if (avatar) {
    avatar.classList.add("gm-pop-init");
    onVisible(avatar, () => {
      avatar.classList.remove("gm-pop-init");
      avatar.classList.add("gm-pop-play");
    }, 0.3);
  }

  /* ---- 2. 「（※本人はいたって大真面目です）」：ぷるぷる揺れる ---- */
  const roleWhisper = document.querySelector(".profile-hero .role .whisper");
  if (roleWhisper) {
    roleWhisper.style.display = "inline-block";
    onVisible(roleWhisper, () => roleWhisper.classList.add("gm-shake-play"), 0.6);
  }

  /* ---- 3・4. プロフィール文中のマーカー：スクロールで下線が引かれる ---- */
  const heroWrap = document.querySelector(".profile-hero");
  const heroMarker = document.querySelector(".profile-hero p .marker");
  const heroMarkerBlue = document.querySelector(".profile-hero p .marker-blue");
  if (heroWrap && (heroMarker || heroMarkerBlue)) {
    onVisible(
      heroWrap,
      () => {
        if (heroMarker) drawLinesAcross(heroMarker, heroWrap, { colorClass: "gm-line-gold" });
        if (heroMarkerBlue) {
          setTimeout(() => drawLinesAcross(heroMarkerBlue, heroWrap, { colorClass: "gm-line-blue" }), 300);
        }
      },
      0.4
    );
  }

  /* ---- 5. 肩書タグ（開業ナシ／勤務中／個人受任アリ）：時間差でぽこぽこ登場 ---- */
  const wobbleTags = document.querySelectorAll(".wobble-tag");
  if (wobbleTags.length) {
    wobbleTags.forEach((tag, i) => {
      tag.classList.add("gm-pop-init");
      tag.style.animationDelay = `${i * 130}ms`;
    });
    onVisible(
      wobbleTags[0].closest("p") || wobbleTags[0],
      () => {
        wobbleTags.forEach((tag) => {
          tag.classList.remove("gm-pop-init");
          tag.classList.add("gm-pop-play");
        });
      },
      0.5
    );
  }

  /* ---- 6. ステータスカードの数値バー：伸びながらカウントアップ ---- */
  const statusCard = document.querySelector(".status-card");
  if (statusCard) {
    const rows = statusCard.querySelectorAll(".status-row");
    // 初期状態：バーとカウンターを0に戻しておく（本来値はdata属性に退避）
    rows.forEach((row) => {
      const fill = row.querySelector(".status-fill");
      const valueEl = row.querySelector(".status-value");
      if (fill) {
        fill.dataset.targetWidth = fill.style.width;
        fill.style.width = "0%";
      }
      if (valueEl) {
        valueEl.dataset.targetText = valueEl.textContent.trim();
        if (/^\d+%$/.test(valueEl.dataset.targetText)) valueEl.textContent = "0%";
      }
    });

    onVisible(
      statusCard,
      () => {
        rows.forEach((row, i) => {
          const fill = row.querySelector(".status-fill");
          const valueEl = row.querySelector(".status-value");
          setTimeout(() => {
            if (fill) fill.style.width = fill.dataset.targetWidth || "0%";
            if (valueEl) {
              const targetText = valueEl.dataset.targetText || valueEl.textContent;
              const match = targetText.match(/^(\d+)%$/);
              if (match) {
                const target = parseInt(match[1], 10);
                const duration = 1100;
                const start = performance.now();
                function tick(now) {
                  const p = Math.min(1, (now - start) / duration);
                  valueEl.textContent = `${Math.round(target * p)}%`;
                  if (p < 1) requestAnimationFrame(tick);
                  else valueEl.textContent = targetText;
                }
                requestAnimationFrame(tick);
              }
            }
          }, i * 150);
        });
      },
      0.3
    );
  }

  /* ---- 7. 得意分野スキルバッジ：時間差でぽこぽこ登場 ---- */
  const skillBadges = document.querySelectorAll(".skill-badge");
  if (skillBadges.length) {
    skillBadges.forEach((badge, i) => {
      badge.classList.add("gm-pop-init");
      badge.style.animationDelay = `${i * 100}ms`;
    });
    onVisible(
      document.querySelector(".skill-badges"),
      () => {
        skillBadges.forEach((badge) => {
          badge.classList.remove("gm-pop-init");
          badge.classList.add("gm-pop-play");
        });
      },
      0.4
    );
  }

  /* ---- 8. あゆみタイムライン：スクロールで1件ずつスライドイン ---- */
  document.querySelectorAll(".timeline li").forEach((li) => {
    li.classList.add("gm-slide-init");
    onVisible(
      li,
      () => {
        li.classList.remove("gm-slide-init");
        li.classList.add("gm-slide-play");
      },
      0.35
    );
  });

  /* ---- 9. 「経費として天ぷら代を計上…」：スクロールで打ち消し線が強調される ---- */
  const jokeStrike = document.querySelector(".joke-strike");
  if (jokeStrike) {
    const strikeContainer = jokeStrike.closest(".qa-item");
    if (strikeContainer) {
      onVisible(
        strikeContainer,
        () => drawLinesAcross(jokeStrike, strikeContainer, { colorClass: "gm-line-red", verticalRatio: 0.55, thickness: 3, duration: 500, stagger: 150 }),
        0.5
      );
    }
  }

  /* ---- 10. 「大丈夫か案件」QA：見えたらちょっと動揺したように震える ---- */
  document.querySelectorAll(".qa-item.qa-weird").forEach((item) => {
    onVisible(item, () => item.classList.add("gm-shake-play"), 0.5);
  });
})();
