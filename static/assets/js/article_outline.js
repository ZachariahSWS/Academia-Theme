(() => {
  const [art, outline, labelBox, outline_thread_geometry, threadProg] = [
    "article", "article_outline", "outline_labels", "outline_thread_geometry", "outline_thread_progress",
  ].map((id) => document.getElementById(id));
  const css = getComputedStyle(document.documentElement);
  const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
  const num = (name, fb = 0) => {
    const value = parseFloat(css.getPropertyValue(name));
    return Number.isFinite(value) ? value : fb;
  };
  let items = [], layoutFrame = 0;
  function buildOutline() {
    const frag = document.createDocumentFragment();
    let i = 0;
    items = [...art.querySelectorAll("h1,h2,h3")].map((h) => {
      if (!h.id) h.id = "heading_" + i++;
      const a = Object.assign(document.createElement("a"), {
        className: "outline_link",
        href: "#" + h.id,
        textContent: h.textContent.trim(),
      });
      frag.appendChild(a);
      return { h, a, t: 0, y: 0 };
    });
    labelBox.replaceChildren(frag);
  }
  function layout() {
    layoutFrame = 0;
    if (!items.length) { outline_thread_geometry.removeAttribute("d"); return; }

    const [left, right, loopW, loopH, loopMin] = [
      "--thread-left-space", "--thread-right-space", "--loop-width",
      "--loop-height", "--loop-min-gap",
    ].map(num);
    const loopFloor = num("--loop-near-scale-floor") || 0.6;

    const outlineH = outline.clientHeight || 1;
    const artTop = art.offsetTop;
    const artH = Math.max(1, art.scrollHeight);
    const viewW = (left + right) | 0;

    const count = items.length;
    const gW = new Array(count).fill(loopW);
    const gH = new Array(count).fill(loopH);

    for (let i = 0; i < count; i++) {
      const it = items[i];
      it.t = clamp((it.h.offsetTop - artTop) / artH);
      it.y = it.t * outlineH;
      it.a.style.transform = `translateY(${it.y}px) translateY(-0.5lh)`;
    }

    for (let i = 0; i < count - 1; i++) {
      const gap = Math.abs(items[i + 1].y - items[i].y);
      if (gap < loopH + loopMin) {
        const r = clamp((gap - loopMin) / Math.max(1, loopH), loopFloor);
        gW[i + 1] *= r;
        gH[i + 1] *= r;
      }
    }

    const x = Math.round(left);
    const segs = [`M ${x} ${items[0].y - 0.75 * gH[0]}`];

    for (let i = 0; i < count; i++) {
      const { y } = items[i];
      const h = gH[i], w = gW[i];
      if (i > 0) segs.push(`L ${x} ${y - 0.75 * h}`);
      segs.push(
        `C ${x} ${y + h} ${x + w} ${y} ${x} ${y}`,
        `S ${x} ${y - h} ${x} ${y + 0.75 * h}`,
      );
    }
    segs.push(`L ${x} ${outlineH}`);

    outline_thread_geometry.setAttribute("d", segs.join(" "));
    threadProg.parentNode.setAttribute("viewBox", `0 0 ${viewW} ${outlineH}`);

    updateProgress();
  }
  function updateProgress() {
    const topScroll = window.scrollY || window.pageYOffset || 0;
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    const aTop = art.offsetTop;
    const aH = Math.max(1, art.scrollHeight);
    const botScroll = topScroll + vh;
    const top = clamp((topScroll - aTop) / aH);
    const seg = clamp((botScroll - aTop) / aH) - top;
    threadProg.style.setProperty("--top", top);
    threadProg.style.setProperty("--seg", Math.max(0, seg));
  }
  const scheduleLayout = () =>
    layoutFrame || (layoutFrame = requestAnimationFrame(layout));
  [["scroll", updateProgress], ["resize", scheduleLayout]].forEach(([event, handler]) =>
    window.addEventListener(event, handler, { passive: true }));
  const ro = new ResizeObserver(scheduleLayout);
  [outline, art].forEach((element) => ro.observe(element));
  buildOutline();
  scheduleLayout();
})();
