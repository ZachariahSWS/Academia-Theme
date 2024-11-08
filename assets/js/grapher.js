class SVGChart {
  static SVG_NS = "http://www.w3.org/2000/svg";

  constructor(containerId, data, options = {}) {
    this.container = document.getElementById(containerId);
    this.data = data;
    this.options = {
      width: 300,
      height: 200,
      margin: { top: 40, right: 20, bottom: 30, left: 40 },
      xAxisLabel: "Date",
      yAxisLabel: "Value",
      title: "",
      subtitle: "",
      source: "",
      ...options,
    };

    this.svg = this.createSVG();
    [this.xScale, this.yScale] = this.createScales();
  }

  createSVG() {
    return this.drawElement(
      "svg",
      {
        viewBox: `0 0 ${this.options.width} ${this.options.height}`,
        preserveAspectRatio: "xMidYMid meet",
      },
      this.container,
    );
  }

  createScales() {
    const dates = this.data.map((d) => new Date(d.date));
    const xMin = Math.min(...dates);
    const xMax = Math.max(...dates);
    const yMin = 0;
    const yMax = Math.max(...this.data.map((d) => d.value));

    const xTicks = this.generateNiceTicks(
      new Date(xMin).getFullYear(),
      new Date(xMax).getFullYear(),
      5,
    );
    const yTicks = this.generateNiceTicks(yMin, yMax, 5);

    const xScale = (date) => {
      const dateValue = date instanceof Date ? date : new Date(date);
      return (
        ((dateValue - new Date(xTicks[0], 0, 1)) /
          (new Date(xTicks[xTicks.length - 1], 11, 31) -
            new Date(xTicks[0], 0, 1))) *
          (this.options.width -
            this.options.margin.left -
            this.options.margin.right) +
        this.options.margin.left
      );
    };
    const yScale = (y) =>
      this.options.height -
      this.options.margin.bottom -
      (y / yMax) *
        (this.options.height -
          this.options.margin.top -
          this.options.margin.bottom);

    return [xScale, yScale];
  }

  generateNiceTicks(min, max, targetCount) {
    const range = max - min;
    const roughStep = range / (targetCount - 1);
    const stepMagnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const niceStep =
      roughStep / stepMagnitude >= 5
        ? stepMagnitude * 5
        : roughStep / stepMagnitude >= 2
          ? stepMagnitude * 2
          : stepMagnitude;

    const niceMin = Math.floor(min / niceStep) * niceStep;
    const niceMax = Math.ceil(max / niceStep) * niceStep;

    return Array.from(
      { length: Math.floor((niceMax - niceMin) / niceStep) + 1 },
      (_, i) => niceMin + i * niceStep,
    );
  }

  drawElement(type, attributes = {}, parent = this.svg) {
    const element = document.createElementNS(SVGChart.SVG_NS, type);
    Object.entries(attributes).forEach(([key, value]) =>
      element.setAttribute(key, value),
    );
    parent.appendChild(element);
    return element;
  }

  drawAxisLabels() {
    const dates = this.data.map((d) => new Date(d.date));
    const xMin = Math.min(...dates);
    const xMax = Math.max(...dates);
    const yMin = 0;
    const yMax = Math.max(...this.data.map((d) => d.value));

    const xTicks = this.generateNiceTicks(
      new Date(xMin).getFullYear(),
      new Date(xMax).getFullYear(),
      5,
    );
    const yTicks = [0, ...this.generateNiceTicks(yMin, yMax, 4)];

    xTicks.forEach((year) => {
      const x = this.xScale(new Date(year, 0, 1));
      this.drawElement("text", {
        x,
        y: this.options.height - this.options.margin.bottom + 7.5,
        fill: "var(--primary-color)",
        "font-size": "0.5em",
        "text-anchor": "middle",
        "alignment-baseline": "hanging",
      }).textContent = year;
    });

    yTicks.forEach((value) => {
      const y = this.yScale(value);
      this.drawElement("text", {
        x: this.options.margin.left - 5,
        y,
        fill: "var(--primary-color)",
        "font-size": "0.5em",
        "text-anchor": "end",
        "alignment-baseline": "middle",
      }).textContent = Number.isInteger(value) ? value : value.toFixed(2);
    });
  }

  drawData() {
    const points = this.data
      .map((d) => `${this.xScale(new Date(d.date))},${this.yScale(d.value)}`)
      .join(" ");
    this.drawElement("polyline", {
      points,
      fill: "none",
      stroke: "var(--link-color)",
      "stroke-width": "0.04em",
      class: "scalable-stroke",
    });
  }

  drawAxisPolyline() {
    const { margin, width, height } = this.options;
    this.drawElement("polyline", {
      points: `${margin.left},${margin.top} ${margin.left},${height - margin.bottom} ${width - margin.right},${height - margin.bottom}`,
      fill: "none",
      stroke: "var(--secondary-color)",
      "stroke-width": "0.08em",
      class: "scalable-stroke",
    });
  }

  drawTexts() {
    const { width, height, margin, title, subtitle, source } = this.options;
    if (title) {
      this.drawElement("text", {
        x: width / 2,
        y: margin.top / 3,
        fill: "var(--primary-color)",
        "font-size": "1em",
        "text-anchor": "middle",
        "alignment-baseline": "middle",
      }).textContent = title;
    }
    if (subtitle) {
      this.drawElement("text", {
        x: width / 2,
        y: (margin.top * 2) / 3,
        fill: "var(--secondary-color)",
        "font-size": "0.5em",
        "text-anchor": "middle",
        "alignment-baseline": "middle",
      }).textContent = subtitle;
    }
    if (source) {
      this.drawElement("text", {
        x: width - margin.right,
        y: height - 5,
        fill: "var(--secondary-color)",
        "font-size": "0.3em",
        "text-anchor": "end",
        "alignment-baseline": "baseline",
      }).textContent = `Source: ${source}`;
    }
  }

  render() {
    this.drawTexts();
    this.drawData();
    this.drawAxisPolyline();
    this.drawAxisLabels();
  }
}

function createChartFromJSON(element, jsonFilePath, options = {}) {
  fetch(jsonFilePath)
    .then((response) => response.json())
    .then((jsonData) => {
      const chart = new SVGChart(element.id, jsonData.data, options);
      chart.render();
    })
    .catch((error) => console.error("Error loading the JSON data:", error));
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-chart]").forEach((chartElement) => {
    const jsonFilePath = chartElement.getAttribute("data-chart");
    if (!chartElement.id) {
      chartElement.id = `chart-${Math.random().toString(36).substr(2, 9)}`;
    }
    const options = {
      xAxisLabel: chartElement.getAttribute("data-x-label") ?? "Date",
      yAxisLabel: chartElement.getAttribute("data-y-label") ?? "Value",
      title: chartElement.getAttribute("data-title") ?? "",
      subtitle: chartElement.getAttribute("data-subtitle") ?? "",
      source: chartElement.getAttribute("data-source") ?? "",
    };

    createChartFromJSON(chartElement, jsonFilePath, options);
  });
});
