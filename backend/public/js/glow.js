// Visual effects: (1) a glow that follows the cursor inside cards,
// (2) a soft blue glow that follows the typing caret in text boxes.
(function () {
  "use strict";

  // ---------- 1. Cursor glow inside cards ----------
  // Cards are created dynamically (code blocks, charts, quizzes...), so one
  // delegated listener on the document handles all of them.
  const CARD_SEL = ".auth-box, .modal-box, .code-block, .chart-block, .study-block, .link-card, .user .msg";
  let cardRaf = 0, lastEvt = null;
  document.addEventListener("pointermove", (e) => {
    lastEvt = e;
    if (cardRaf) return;
    cardRaf = requestAnimationFrame(() => {
      cardRaf = 0;
      const t = lastEvt && lastEvt.target;
      const card = t && t.closest ? t.closest(CARD_SEL) : null;
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (lastEvt.clientX - r.left) + "px");
      card.style.setProperty("--my", (lastEvt.clientY - r.top) + "px");
    });
  }, { passive: true });

  // ---------- 2. Caret glow in text boxes ----------
  // The real caret stays (coloured blue in CSS via caret-color); this adds a glowing
  // halo that tracks it. Position comes from a hidden "mirror" copy of the text box.
  const glow = document.createElement("div");
  glow.id = "caret-glow";
  glow.setAttribute("aria-hidden", "true");
  document.body.appendChild(glow);

  const COPY = ["direction", "boxSizing", "borderTopWidth", "borderRightWidth", "borderBottomWidth",
    "borderLeftWidth", "borderStyle", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
    "fontStyle", "fontVariant", "fontWeight", "fontStretch", "fontSize", "fontFamily", "lineHeight",
    "textAlign", "textTransform", "textIndent", "letterSpacing", "wordSpacing", "tabSize"];
  let mirror = null;

  function isTextBox(el) {
    if (!el) return false;
    if (el.tagName === "TEXTAREA") return true;
    if (el.tagName !== "INPUT") return false;
    return ["text", "password", "search", "tel", "url", "email", ""].includes((el.getAttribute("type") || "").toLowerCase());
  }

  function caretPoint(el) {
    let pos;
    try { pos = el.selectionStart; } catch (e) { return null; }
    if (pos === null || pos === undefined || pos !== el.selectionEnd) return null; // no caret (or text is selected)

    const cs = getComputedStyle(el);
    const isInput = el.tagName === "INPUT";
    if (!mirror) {
      mirror = document.createElement("div");
      mirror.setAttribute("aria-hidden", "true");
      document.body.appendChild(mirror);
    }
    mirror.style.cssText = "position:fixed;top:0;left:-99999px;visibility:hidden;overflow:hidden;" +
      "white-space:" + (isInput ? "pre" : "pre-wrap") + ";word-wrap:break-word;";
    COPY.forEach((k) => { mirror.style[k] = cs[k]; });
    mirror.style.width = el.offsetWidth + "px";
    if (isInput) mirror.style.height = el.offsetHeight + "px";

    const text = el.type === "password" ? "\u2022".repeat(pos) : el.value.substring(0, pos);
    mirror.textContent = text;
    const marker = document.createElement("span");
    marker.textContent = "\u200b";
    mirror.appendChild(marker);

    const rect = el.getBoundingClientRect();
    const fs = parseFloat(cs.fontSize) || 16;
    const lh = parseFloat(cs.lineHeight) || fs * 1.25;
    const x = rect.left + marker.offsetLeft - el.scrollLeft;
    let y = isInput
      ? rect.top + (rect.height - lh) / 2
      : rect.top + marker.offsetTop - el.scrollTop;

    // hide the glow when the caret has scrolled out of the visible box
    const padB = parseFloat(cs.paddingBottom) || 0;
    if (x < rect.left || x > rect.right || y < rect.top - 1 || y + lh > rect.bottom - Math.min(padB, 2) + 2) return null;
    return { x, y, h: lh };
  }

  let active = null, raf = 0;
  function update() {
    raf = 0;
    if (!active || document.activeElement !== active) { glow.classList.remove("on"); return; }
    const p = caretPoint(active);
    if (!p) { glow.classList.remove("on"); return; }
    glow.style.height = p.h + "px";
    glow.style.transform = "translate(" + p.x + "px," + p.y + "px)";
    glow.classList.add("on");
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(update); }

  document.addEventListener("focusin", (e) => {
    if (isTextBox(e.target)) { active = e.target; schedule(); }
  });
  document.addEventListener("focusout", (e) => {
    if (e.target === active) { active = null; glow.classList.remove("on"); }
  });
  ["input", "keydown", "keyup", "mouseup", "click", "select", "scroll", "compositionupdate"].forEach((ev) => {
    document.addEventListener(ev, (e) => { if (e.target === active) schedule(); }, true);
  });
  document.addEventListener("selectionchange", () => { if (active) schedule(); });
  window.addEventListener("resize", schedule);
})();
