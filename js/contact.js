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
