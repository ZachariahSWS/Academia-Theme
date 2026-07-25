(() => {
  "use strict";

  const numberFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 });
  const setAttributes = (element, attributes) => Object.entries(attributes)
    .forEach(([name, value]) => element.setAttribute(name, String(value)));
  const svgPoint = (svg, x, y) => {
    const point = svg.createSVGPoint();
    point.x = x; point.y = y;
    return point;
  };
  const chartData = (chart) => [...chart.querySelectorAll("tbody tr")]
    .map((row) => {
      const time = row.querySelector("time");
      return {
        date: new Date(`${time.dateTime}T00:00:00Z`),
        dateLabel: time.dataset.line_chart_date_label,
        values: [...row.querySelectorAll("[data-line_chart_value]")]
          .map(({ dataset }) => dataset.line_chart_value === "" ? NaN : Number(dataset.line_chart_value)),
      };
    });
  function enhanceChart(container) {
    const chart = container.closest(".line_chart");
    const svg = container.querySelector("svg");
    const plot = svg?.querySelector(".line_chart_drawing_area");
    const pointerTarget = plot?.querySelector(".line_chart_interaction_target");
    const crosshair = plot?.querySelector(".line_chart_cursor_line");
    const markers = [...(plot?.querySelectorAll(".line_chart_selected_point") || [])];
    const tooltip = container.querySelector(".line_chart_tooltip");
    const tooltipDate = tooltip?.querySelector("[data-line_chart_tooltip_date]");
    const tooltipValues = [...(tooltip?.querySelectorAll("[data-line_chart_tooltip_series_index]") || [])];
    if (!chart || !svg || !plot || !pointerTarget || !crosshair || !tooltip ||
        !tooltipDate) return;
    const data = chartData(chart);
    if (data.length === 0) return;
    const {
      line_chart_plot_width: plotWidth,
      line_chart_plot_height: plotHeight,
      line_chart_date_minimum: dateMin,
      line_chart_date_maximum: dateMax,
      line_chart_value_minimum: yMin,
      line_chart_value_maximum: yMax,
    } = container.dataset;
    const [width, height, dateMinimum, dateMaximum, yMinimum, yMaximum] =
      [plotWidth, plotHeight, dateMin, dateMax, yMin, yMax].map(Number);
    const scaleX = (date) =>
      ((date.getTime() - dateMinimum) / (dateMaximum - dateMinimum)) * width;
    const scaleY = (value) => height -
      ((value - yMinimum) / (yMaximum - yMinimum || 1)) * height;
    let touchSelectionLocked = false;
    let selectedIndex = -1;
    const hideSelection = () => {
      [crosshair, ...markers].forEach((element) =>
        element.setAttribute("visibility", "hidden"));
      tooltip.hidden = true;
    };
    const showSelection = (point, crosshairX) => {
      const matrix = plot.getScreenCTM();
      if (!matrix) return;
      const pointX = scaleX(point.date);
      setAttributes(crosshair, {
        x1: crosshairX, x2: crosshairX, visibility: "visible",
      });
      markers.forEach((marker, index) => {
        const value = point.values[index];
        setAttributes(marker, {
          cx: pointX, cy: Number.isFinite(value) ? scaleY(value) : 0,
          visibility: Number.isFinite(value) ? "visible" : "hidden",
        });
      });
      tooltipDate.textContent = point.dateLabel;
      tooltipValues.forEach((element, index) => {
        const value = point.values[index];
        element.textContent = Number.isFinite(value) ? numberFormatter.format(value) : "—";
      });
      tooltip.hidden = false;
      const position = svgPoint(svg, pointX, scaleY(point.values.find(Number.isFinite)))
        .matrixTransform(matrix);
      const bounds = container.getBoundingClientRect();
      const halfTooltip = tooltip.offsetWidth / 2 + 4;
      const desiredLeft = position.x - bounds.left;
      tooltip.style.left = `${Math.max(halfTooltip, Math.min(bounds.width - halfTooltip, desiredLeft))}px`;
      tooltip.style.top = `${position.y - bounds.top}px`;
      tooltip.classList.toggle("line_chart_tooltip_below",
        position.y - bounds.top < tooltip.offsetHeight + 12,
      );
    };
    const moveCrosshair = (event) => {
      const matrix = plot.getScreenCTM();
      if (!matrix) return;
      const local = svgPoint(svg, event.clientX, event.clientY)
        .matrixTransform(matrix.inverse());
      const x = Math.max(0, Math.min(width, local.x));
      selectedIndex = data.reduce((nearestIndex, point, index) =>
        Math.abs(scaleX(point.date) - x) <
          Math.abs(scaleX(data[nearestIndex].date) - x) ? index : nearestIndex, 0);
      showSelection(data[selectedIndex], x);
    };
    const movePointer = (event) => {
      if (event.pointerType === "touch") return;
      touchSelectionLocked = false;
      moveCrosshair(event);
    };
    container.classList.add("line_chart_interactive");
    for (const type of ["pointerenter", "pointermove"])
      pointerTarget.addEventListener(type, movePointer);
    pointerTarget.addEventListener("pointerup", (event) => {
      if (event.pointerType !== "touch") return;
      touchSelectionLocked = true;
      moveCrosshair(event);
    });
    pointerTarget.addEventListener("pointerleave", () =>
      !touchSelectionLocked && hideSelection());
    document.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const hoveredPointer = document.querySelector(".line_chart_interaction_target:hover");
      if ((hoveredPointer || document.activeElement) !== pointerTarget) return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      selectedIndex = selectedIndex < 0
        ? direction > 0 ? 0 : data.length - 1
        : Math.max(0, Math.min(data.length - 1, selectedIndex + direction));
      const point = data[selectedIndex];
      showSelection(point, scaleX(point.date));
    });
    document.addEventListener("pointerdown", (event) => {
      if (touchSelectionLocked && event.target instanceof Node && !container.contains(event.target)) {
        touchSelectionLocked = false;
        hideSelection();
      }
    });
  }
  const initializeCharts = () =>
    document.querySelectorAll("[data-line_chart_interactive]").forEach(enhanceChart);
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", initializeCharts);
  else initializeCharts();
})();
