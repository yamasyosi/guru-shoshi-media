/* ============================================================
   お問い合わせページ：フォーム内容をメール本文に組み立てて
   sladvz@gmail.com 宛の mailto: リンクを起動する
   （静的サイトのためサーバー送信は行わず、利用者自身のメールアプリから送信してもらう方式）
   ============================================================ */
(function () {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const CONTACT_EMAIL = "sladvz@gmail.com";

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = form.querySelector("#cf-name").value.trim() || "匿名希望";
    const location = form.querySelector("#cf-location").value.trim() || "（特に指定なし・お任せで）";
    const purpose = form.querySelector("#cf-purpose").value.trim() || "（特になし）";
    const genreInput = form.querySelector('input[name="genre"]:checked');

    if (!genreInput) {
      alert("ジャンルを1つ選んでください。これが決まらないと、グルメ司法書士も出動できません。");
      form.querySelector("#genreGroup").scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const genre = genreInput.value;

    const subject = `【レストラン相談】${genre}のオススメを求む`;
    const body = [
      "グルメ司法書士 様",
      "",
      "レストランのご相談です。",
      "",
      `■ お名前：${name}`,
      `■ 希望するレストランの場所：${location}`,
      `■ レストランを使う目的：${purpose}`,
      `■ おすすめして欲しいジャンル：${genre}`,
      "",
      "よろしくお願いいたします。",
      "",
      "―――――――――――――――――",
      "本メールは「グルメ司法書士のレストランナビ」お問い合わせフォームより送信されました。",
    ].join("\n");

    const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  });
})();

/* ============================================================
   お問い合わせページ：スクロール（スワイプ）連動ギミック
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

  /* ---- 1. ヒーローの「グルメ司法書士が«本気»でご相談に乗ります」：金色マーカー下線 ---- */
  const heroWrap = document.querySelector(".profile-hero");
  const heroMarker = document.getElementById("contactMarker");
  if (heroWrap && heroMarker) {
    onVisible(heroWrap, () => drawLinesAcross(heroMarker, heroWrap, { colorClass: "gm-line-gold" }), 0.4);
  }

  /* ---- 2. 法律相談メニュー：見えたら1件ずつ「不受理」✕スタンプが押される ---- */
  const disclaimerList = document.getElementById("disclaimerList");
  if (disclaimerList) {
    const items = Array.from(disclaimerList.querySelectorAll("li"));
    items.forEach((li) => {
      const stamp = document.createElement("span");
      stamp.className = "gm-x-stamp";
      stamp.setAttribute("aria-hidden", "true");
      stamp.textContent = "✕";
      li.appendChild(stamp);
    });
    onVisible(
      disclaimerList,
      () => {
        items.forEach((li, i) => {
          setTimeout(() => {
            li.querySelector(".gm-x-stamp").classList.add("gm-stamp-play");
          }, i * 160);
        });
      },
      0.4
    );
  }

  /* ---- 3. 「«本業»のご相談は一切承っておりません。」：赤い打ち消し線が引かれる ---- */
  const disclaimerCard = document.getElementById("disclaimerCard");
  const banPhrase = document.getElementById("banPhrase");
  if (disclaimerCard && banPhrase) {
    onVisible(
      disclaimerCard,
      () => {
        // ✕スタンプが押し終わる頃合いに合わせて少し遅らせる
        setTimeout(() => {
          drawLinesAcross(banPhrase, disclaimerCard, {
            colorClass: "gm-line-red",
            verticalRatio: 0.55,
            thickness: 3,
            duration: 600,
            stagger: 180,
          });
        }, 700);
      },
      0.4
    );
  }

  /* ---- 4. ジャンル選択肢：見えたら時間差でぽこぽこ登場 ---- */
  const radioOptions = document.querySelectorAll(".radio-option");
  if (radioOptions.length) {
    radioOptions.forEach((opt, i) => {
      opt.classList.add("gm-pop-init");
      opt.style.animationDelay = `${i * 80}ms`;
    });
    onVisible(
      document.getElementById("genreGroup"),
      () => {
        radioOptions.forEach((opt) => {
          opt.classList.remove("gm-pop-init");
          opt.classList.add("gm-pop-play");
        });
      },
      0.3
    );
  }

  /* ---- 5. 送信ボタン：見えたら、そっと光って誘う ---- */
  const submitBtn = document.querySelector(".contact-submit");
  if (submitBtn) {
    onVisible(submitBtn, () => submitBtn.classList.add("gm-invite-play"), 0.6);
  }
})();
