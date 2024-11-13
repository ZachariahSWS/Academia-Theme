// Configuration object
const CONFIG = {
  DEPENDENCIES: {
    D3: "https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js",
  },
  DEFAULT_CHART_OPTIONS: {
    width: 800,
    height: 400,
    margin: { top: 80, right: 60, bottom: 60, left: 60 },
    color: "var(--link-color)",
  },
  STYLES: `
    .auto-chart {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .auto-chart-line {
      fill: none;
      stroke: var(--link-color);
      stroke-width: 2;
    }
    .auto-chart-grid line {
      stroke: var(--secondary-color);
    }
    .auto-chart-grid path {
      stroke-width: 0;
    }
    .auto-chart-loading,
    .auto-chart-error {
      text-align: center;
      padding: 20px;
      color: var(--off-background-color);
    }
  `,
};

// Utility functions
const utils = {
  loadScript: async (src) => {
    return new Promise((resolve, reject) => {
      if (window.d3) return resolve();

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  },

  addStyles: (() => {
    let initialized = false;
    return () => {
      if (initialized) return;
      const style = document.createElement("style");
      style.textContent = CONFIG.STYLES;
      document.head.appendChild(style);
      initialized = true;
    };
  })(),

  parseChartOptions: (element) => {
    try {
      return {
        ...CONFIG.DEFAULT_CHART_OPTIONS,
        ...JSON.parse(element.getAttribute("data-options") || "{}"),
        width: element.clientWidth || CONFIG.DEFAULT_CHART_OPTIONS.width,
      };
    } catch (error) {
      console.error("Error parsing chart options:", error);
      return CONFIG.DEFAULT_CHART_OPTIONS;
    }
  },
};

// Chart creation class
class LineChart {
  constructor(container, data, options) {
    this.container = container;
    this.data = this.parseData(data);
    this.options = options;
    this.init();
  }

  parseData(data) {
    const parseDate = d3.timeParse("%Y-%m-%d");
    return data
      .filter((d) => d.date && d.value)
      .map((d) => ({
        date: parseDate(d.date),
        value: +d.value,
      }))
      .sort((a, b) => a.date - b.date);
  }

  createScales() {
    const { width, height, margin } = this.options;
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    this.x = d3
      .scaleTime()
      .domain(d3.extent(this.data, (d) => d.date))
      .range([0, chartWidth]);

    this.y = d3
      .scaleLinear()
      .domain([0, d3.max(this.data, (d) => d.value) * 1.1])
      .range([chartHeight, 0]);

    return { chartWidth, chartHeight };
  }

  init() {
    const { width, height, margin } = this.options;
    const { chartWidth, chartHeight } = this.createScales();

    this.container.innerHTML = "";
    const svg = d3
      .select(this.container)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    this.drawGrid(svg, chartWidth, chartHeight);
    this.drawAxes(svg, chartHeight);
    this.drawLine(svg);
    this.addLabels(svg, chartWidth, chartHeight);
  }

  drawGrid(svg, width, height) {
    svg
      .append("g")
      .attr("class", "auto-chart-grid")
      .call(d3.axisLeft(this.y).tickSize(-width).tickFormat(""));
  }

  drawAxes(svg, height) {
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(this.x))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("transform", "rotate(-45)");

    svg.append("g").call(d3.axisLeft(this.y));
  }

  drawLine(svg) {
    const line = d3
      .line()
      .x((d) => this.x(d.date))
      .y((d) => this.y(d.value));

    svg
      .append("path")
      .datum(this.data)
      .attr("class", "auto-chart-line")
      .style("stroke", this.options.color)
      .attr("d", line);
  }

  addLabels(svg, width, height) {
    const { title, subtitle, xLabel, yLabel, source, margin } = this.options;

    if (title) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "1.5em")
        .style("fill", "var(--primary-color)")
        .text(title);

      if (subtitle) {
        svg
          .append("text")
          .attr("x", width / 2)
          .attr("y", -margin.top / 4)
          .attr("text-anchor", "middle")
          .style("font-size", "1em")
          .style("fill", "var(--secondary-color)")
          .text(subtitle);
      }
    }

    if (xLabel) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .style("fill", "var(--secondary-color)")
        .text(xLabel);
    }

    if (yLabel) {
      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .style("fill", "var(--secondary-color)")
        .text(yLabel);
    }

    if (source) {
      svg
        .append("text")
        .attr("x", width)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "end")
        .style("font-size", "0.8em")
        .style("fill", "var(--secondary-color)")
        .text(`Source: ${source}`);
    }
  }
}

// Main initialization function
async function initAutoCharts() {
  try {
    await utils.loadScript(CONFIG.DEPENDENCIES.D3);
    utils.addStyles();

    const chartElements = document.querySelectorAll("[data-chart-csv]");

    await Promise.all(
      [...chartElements].map(async (element) => {
        try {
          element.classList.add("auto-chart");
          element.textContent = "Loading chart...";

          const response = await fetch(element.getAttribute("data-chart-csv"));
          if (!response.ok) throw new Error("Failed to fetch CSV");

          const csvText = await response.text();
          const data = d3.csvParse(csvText);
          const options = utils.parseChartOptions(element);

          new LineChart(element, data, options);
        } catch (error) {
          console.error("Error creating chart:", error);
          element.classList.add("auto-chart-error");
          element.textContent =
            "Error loading chart. Please check console for details.";
        }
      }),
    );
  } catch (error) {
    console.error("Error initializing charts:", error);
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAutoCharts);
} else {
  initAutoCharts();
}
