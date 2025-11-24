(() => {
  const art = document.getElementById("article");
  const outline = document.getElementById("outline");
  const labelBox = document.getElementById("outlineLabels");
  const threadGeom = document.getElementById("threadGeom");
  const threadProg = document.getElementById("threadProgress");
  const root = document.documentElement;
  const css = getComputedStyle(root);

  const clamp = (x, lo = 0, hi = 1) => (x < lo ? lo : x > hi ? hi : x);
  const num = (name, fb = 0) => {
    const v = parseFloat(css.getPropertyValue(name));
    return Number.isFinite(v) ? v : fb;
  };

  const items = [];
  let needLayout = false;

  function buildOutline() {
    items.length = 0;
    labelBox.textContent = "";
    const frag = document.createDocumentFragment();
    let i = 0;
    art.querySelectorAll("h1,h2,h3").forEach((h) => {
      if (!h.id) h.id = "hdr-" + i++;
      const a = document.createElement("a");
      a.className = "outline__item";
      a.href = "#" + h.id;
      a.textContent = h.textContent.trim();
      frag.appendChild(a);
      items.push({ h, a, t: 0, y: 0 });
    });
    labelBox.appendChild(frag);
  }

  function layout() {
    needLayout = false;
    if (!items.length) {
      threadGeom.removeAttribute("d");
      return;
    }

    const left = num("--thread-left-space");
    const right = num("--thread-right-space");
    const loopW = num("--loop-width");
    const loopH = num("--loop-height");
    const loopMin = num("--loop-min-gap");
    const loopFloor =
      parseFloat(css.getPropertyValue("--loop-near-scale-floor")) || 0.6;

    const outlineH = outline.clientHeight || 1;
    const artTop = art.offsetTop;
    const artH = Math.max(1, art.scrollHeight);
    const viewW = (left + right) | 0;

    const N = items.length;
    const gW = new Array(N).fill(loopW);
    const gH = new Array(N).fill(loopH);

    for (let i = 0; i < N; i++) {
      const it = items[i];
      it.t = clamp((it.h.offsetTop - artTop) / artH);
      it.y = it.t * outlineH;
      it.a.style.transform = `translateY(${it.y}px) translateY(-50%)`;
    }

    for (let i = 0; i < N - 1; i++) {
      const gap = Math.abs(items[i + 1].y - items[i].y);
      if (gap < loopH + loopMin) {
        const r = clamp((gap - loopMin) / Math.max(1, loopH), loopFloor);
        gW[i + 1] *= r;
        gH[i + 1] *= r;
      }
    }

    const x = Math.round(left);
    const segs = [];
    segs.push(`M ${x} ${items[0].y - 0.75 * gH[0]}`);

    for (let i = 0; i < N; i++) {
      const { y } = items[i];
      const h = gH[i];
      const w = gW[i];
      if (i > 0) segs.push(`L ${x} ${y - 0.75 * h}`);
      segs.push(
        `C ${x} ${y + h} ${x + w} ${y} ${x} ${y}`,
        `S ${x} ${y - h} ${x} ${y + 0.75 * h}`,
      );
    }
    segs.push(`L ${x} ${outlineH}`);

    threadGeom.setAttribute("d", segs.join(" "));
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

  function scheduleLayout() {
    if (!needLayout) {
      needLayout = true;
      requestAnimationFrame(layout);
    }
  }

  window.addEventListener("scroll", () => updateProgress(), {
    passive: true,
  });
  window.addEventListener("resize", scheduleLayout, { passive: true });

  const ro = new ResizeObserver(scheduleLayout);
  ro.observe(outline);
  ro.observe(art);

  buildOutline();
  scheduleLayout();
})();
