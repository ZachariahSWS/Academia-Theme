// Load required dependencies dynamically
async function loadDependencies() {
  if (typeof d3 === "undefined") {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
}

// Add styles once
const addStyles = (() => {
  let added = false;
  return () => {
    if (added) return;
    const style = document.createElement("style");
    style.textContent = `
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
      .auto-chart-loading {
        text-align: center;
        padding: 20px;
        color: var(--off-background-color);
      }
      .auto-chart-error {
        text-align: center;
        padding: 20px;
        color: var(--off-background-color);
      }
    `;
    document.head.appendChild(style);
    added = true;
  };
})();

async function createChart(container, data, options = {}) {
  const opts = {
    width: options.width || container.clientWidth || 800,
    height: options.height || 400,
    margin: { top: 80, right: 60, bottom: 60, left: 60 },
    title: options.title || "",
    subtitle: options.subtitle || "",
    xLabel: options.xLabel || "",
    yLabel: options.yLabel || "",
    color: options.color || "var(--link-color)",
  };

  const width = opts.width - opts.margin.left - opts.margin.right;
  const height = opts.height - opts.margin.top - opts.margin.bottom;

  // Clear container
  container.innerHTML = "";

  // Create SVG
  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", opts.width)
    .attr("height", opts.height)
    .append("g")
    .attr("transform", `translate(${opts.margin.left},${opts.margin.top})`);

  // Parse dates and values
  const parseDate = d3.timeParse("%Y-%m-%d");
  const parsedData = data
    .filter((d) => d.date && d.value) // Remove invalid entries
    .map((d) => ({
      date: parseDate(d.date),
      value: +d.value,
    }))
    .sort((a, b) => a.date - b.date);

  // Create scales
  const x = d3
    .scaleTime()
    .domain(d3.extent(parsedData, (d) => d.date))
    .range([0, width]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(parsedData, (d) => d.value) * 1.1])
    .range([height, 0]);

  // Add grid
  svg
    .append("g")
    .attr("class", "auto-chart-grid")
    .call(d3.axisLeft(y).tickSize(-width).tickFormat(""));

  // Add axes
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("transform", "rotate(-45)");

  svg.append("g").call(d3.axisLeft(y));

  // Add line
  const line = d3
    .line()
    .x((d) => x(d.date))
    .y((d) => y(d.value));

  svg
    .append("path")
    .datum(parsedData)
    .attr("class", "auto-chart-line")
    .style("stroke", opts.color)
    .attr("d", line);

  // Add title if provided
  if (opts.title) {
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -opts.margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "1.5em")
      .style("fill", opts.titleColor || "var(--primary-color)")
      .text(opts.title);
    if (opts.subtitle) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", -opts.margin.top / 4)
        .attr("text-anchor", "middle")
        .style("font-size", "1em")
        .style("fill", opts.titleColor || "var(--secondary-color)")
        .text(opts.subtitle);
    }
  }
  // Add X axis label
  if (opts.xLabel) {
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + opts.margin.bottom - 10)
      .attr("text-anchor", "middle")
      .style("fill", "var(--secondary-color)")
      .text(opts.xLabel);
  }

  // Add Y axis label
  if (opts.yLabel) {
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -opts.margin.left + 20)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .style("fill", "var(--secondary-color)")
      .text(opts.yLabel);
  }
}

// Main initialization function
async function initAutoCharts() {
  try {
    await loadDependencies();
    addStyles();

    document.querySelectorAll("[data-chart-csv]").forEach(async (element) => {
      try {
        // Show loading state
        element.classList.add("auto-chart");
        element.textContent = "Loading chart...";

        const csvPath = element.getAttribute("data-chart-csv");
        const options = JSON.parse(
          element.getAttribute("data-options") || "{}",
        );

        // Fetch and parse CSV
        const response = await fetch(csvPath);
        const csvText = await response.text();
        const data = d3.csvParse(csvText);

        // Create chart
        await createChart(element, data, options);
      } catch (error) {
        console.error("Error creating chart:", error);
        element.classList.add("auto-chart-error");
        element.textContent =
          "Error loading chart. Please check console for details.";
      }
    });
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
