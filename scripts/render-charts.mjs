import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";

const DAY = 24 * 60 * 60 * 1000;
const WIDTH = 800;
const HEIGHT = 400;
const MARGIN = { top: 8, right: 24, bottom: 60, left: 56 };
const DATE_FORMATS = {
  day: { month: "short", day: "numeric" },
  month: { month: "short" },
  year: { year: "numeric" },
};
const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 });
const chartPlaceholderPattern = /^([ \t]*)<div class="line_chart_source"([^>]*)>[\s\S]*?<\/div>/gm;

async function filesEndingIn(directory, extension) {
  const entries = await readdir(directory);
  const files = [];

  for (const entry of entries) {
    const path = resolve(directory, entry);
    const details = await stat(path);
    if (details.isDirectory()) files.push(...(await filesEndingIn(path, extension)));
    else if (path.endsWith(extension)) files.push(path);
  }
  return files;
}

function decodeHtml(value) {
  const named = { amp: "&", apos: "'", gt: ">", lt: "<", quot: '"' };
  return value.replace(/&(#x[\da-f]+|#\d+|amp|apos|gt|lt|quot);/gi, (_match, entity) => {
    if (entity[0] !== "#") return named[entity.toLowerCase()];
    const hexadecimal = entity[1].toLowerCase() === "x";
    return String.fromCodePoint(Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10));
  });
}

const escapeText = (value) => String(value)
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const escapeAttribute = (value) => escapeText(value).replaceAll('"', "&quot;");
const coordinate = (value) => Number(value.toFixed(2));

function attributes(source) {
  return Object.fromEntries(
    [...source.matchAll(/\s(data-[\w-]+)="([^"]*)"/g)]
      .map(([, name, value]) => [name.slice(5).replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase()), decodeHtml(value)]),
  );
}

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => {
    pushField();
    if (row.some((value) => value !== "")) rows.push(row);
    row = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"' && field === "") quoted = true;
    else if (character === ",") pushField();
    else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      pushRow();
    } else field += character;
  }

  pushRow();
  if (quoted) throw new Error("CSV contains an unterminated quoted field");
  if (rows.length < 2) throw new Error("CSV contains no data rows");
  const headers = rows.shift().map((header, index) =>
    (index === 0 ? header.replace(/^\uFEFF/, "") : header).trim());
  if (!headers.includes("date")) throw new Error('CSV must contain a "date" column');
  if (headers.length < 2) throw new Error("CSV must contain at least one series column");
  return rows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function parseDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day ? date : null;
}

function parseData(rows) {
  const series = Object.keys(rows[0]).filter((header) => header !== "date");
  if (series.length > 3) throw new Error("CSV may contain no more than three series");
  const data = rows.map((row) => ({
    date: parseDate(row.date),
    values: series.map((name) => row[name].trim() === "" ? Number.NaN : Number(row[name])),
  })).filter((point) => point.date && point.values.some(Number.isFinite))
    .sort((a, b) => a.date - b.date);
  if (data.length === 0) throw new Error("CSV contains no valid data points");
  series.forEach((name, index) => {
    if (!data.some((point) => Number.isFinite(point.values[index])))
      throw new Error(`Series "${name}" contains no valid values`);
  });
  return { data, series };
}

function niceStep(span, targetTickCount = 5) {
  const roughStep = span / Math.max(1, targetTickCount - 1);
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const residual = roughStep / magnitude;
  return (residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10) * magnitude;
}

function linearTicks(minimum, maximum, targetTickCount = 5) {
  if (minimum === maximum) maximum = minimum === 0 ? 1 : minimum + Math.abs(minimum);
  const span = maximum - minimum || Math.max(1, Math.abs(maximum));
  const step = niceStep(span, targetTickCount);
  const start = Math.floor(minimum / step) * step;
  const end = Math.ceil(maximum / step) * step;
  return { minimum: start, maximum: end,
    values: Array.from({ length: Math.round((end - start) / step) + 1 }, (_value, index) => start + index * step) };
}

function sampledDates(data, maximumTicks = 6) {
  if (data.length <= maximumTicks) return data.map((point) => point.date);
  return Array.from({ length: maximumTicks }, (_value, index) =>
    data[Math.round((index * (data.length - 1)) / (maximumTicks - 1))].date);
}

function resolvedDateFormat(format, minimum, maximum) {
  if (!format || format === "adaptive") {
    const days = (maximum - minimum) / DAY;
    return days <= 120 ? "day" : days <= 370 ? "month" : days <= 1095 ? "month_year" : "year";
  }
  return format;
}

function dateLabelFormatter(format) {
  if (format === "iso") return (date) => date.toISOString().slice(0, 10);
  if (format === "month_year") {
    const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
    return (date) => `${monthFormatter.format(date)} ’${String(date.getUTCFullYear()).slice(-2)}`;
  }
  if (!DATE_FORMATS[format]) throw new Error(`Unknown date format "${format}"`);
  const formatter = new Intl.DateTimeFormat("en-US", { ...DATE_FORMATS[format], timeZone: "UTC" });
  return (date) => formatter.format(date);
}

function tooltipDateFormatter(format) {
  if (format === "iso") return (date) => date.toISOString().slice(0, 10);
  const options = format === "year" ? { year: "numeric" } : format === "day"
    ? { year: "numeric", month: "short", day: "numeric" }
    : { year: "numeric", month: "short" };
  const formatter = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" });
  return (date) => formatter.format(date);
}

function linePath(data, seriesIndex, scaleX, scaleY) {
  let drawing = false;
  return data.flatMap((point) => {
    const value = point.values[seriesIndex];
    if (!Number.isFinite(value)) { drawing = false; return []; }
    const command = drawing ? "L" : "M";
    drawing = true;
    return [`${command} ${coordinate(scaleX(point.date))} ${coordinate(scaleY(value))}`];
  });
}

function renderChart(config, parsed, { staticMode = false, xmlMode = false } = {}) {
  const { data, series } = parsed;
  const title = config.line_chart_title || "";
  const label = title || "Line chart";
  const xLabel = config.line_chart_x_axis_label || "";
  const yLabel = config.line_chart_y_axis_label || "";
  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const dateValues = data.map((point) => point.date.getTime());
  const values = data.flatMap((point) => point.values).filter(Number.isFinite);
  let dateMinimum = Math.min(...dateValues), dateMaximum = Math.max(...dateValues);
  if (dateMinimum === dateMaximum) { dateMinimum -= DAY; dateMaximum += DAY; }
  const yTicks = linearTicks(Math.min(0, ...values), Math.max(0, ...values));
  const scaleX = (date) => ((date.getTime() - dateMinimum) / (dateMaximum - dateMinimum)) * plotWidth;
  const scaleY = (value) => plotHeight -
    ((value - yTicks.minimum) / (yTicks.maximum - yTicks.minimum || 1)) * plotHeight;
  const dateFormat = resolvedDateFormat(config.line_chart_date_format, dateMinimum, dateMaximum);
  const formatDate = dateLabelFormatter(dateFormat);
  const formatTooltipDate = tooltipDateFormatter(dateFormat);
  const seriesLabels = series.length === 1 && yLabel ? [yLabel] : series;
  const lines = [];
  const add = (level, text = "") => lines.push(`${"  ".repeat(level)}${text}`);

  add(0, '<div class="line_chart">');
  add(1, '<figure class="line_chart_figure">');
  if (title || config.line_chart_subtitle) {
    add(2, '<figcaption class="line_chart_caption">');
    if (title) add(3, `<span class="line_chart_title">${escapeText(title)}</span>`);
    if (config.line_chart_subtitle) add(3, `<span class="line_chart_subtitle">${escapeText(config.line_chart_subtitle)}</span>`);
    add(2, "</figcaption>");
  }
  if (staticMode) {
    add(2, '<div class="line_chart_plot">');
  } else {
    add(2, '<div class="line_chart_plot"');
    add(3, 'data-line_chart_interactive');
    add(3, `data-line_chart_date_minimum="${dateMinimum}"`);
    add(3, `data-line_chart_date_maximum="${dateMaximum}"`);
    add(3, `data-line_chart_value_minimum="${yTicks.minimum}"`);
    add(3, `data-line_chart_value_maximum="${yTicks.maximum}"`);
    add(3, `data-line_chart_plot_width="${plotWidth}"`);
    add(3, `data-line_chart_plot_height="${plotHeight}">`);
  }
  add(3, `<svg${xmlMode ? ' xmlns="http://www.w3.org/2000/svg"' : ""} viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${escapeAttribute(label)}">`);
  add(4, `<desc>A line chart containing ${series.length} series across ${data.length} dates.</desc>`);
  add(4, `<g class="line_chart_drawing_area" transform="translate(${MARGIN.left} ${MARGIN.top})">`);
  add(5, '<g class="line_chart_grid" aria-hidden="true">');
  yTicks.values.forEach((value) => {
    const y = coordinate(scaleY(value));
    add(6, `<line x1="0" y1="${y}" x2="${plotWidth}" y2="${y}" />`);
  });
  add(5, "</g>");
  add(5, '<g class="line_chart_axes">');
  yTicks.values.forEach((value) => {
    const y = coordinate(scaleY(value));
    add(6, `<text x="-10" y="${y + 4}" text-anchor="end">${numberFormatter.format(value)}</text>`);
  });
  sampledDates(data).forEach((date) => {
    const x = coordinate(scaleX(date));
    add(6, `<text x="${x}" y="${plotHeight + 22}" text-anchor="middle">${escapeText(formatDate(date))}</text>`);
  });
  add(6, '<g class="line_chart_axis_baseline" aria-hidden="true">');
  add(7, `<line x1="0" y1="${plotHeight}" x2="${plotWidth}" y2="${plotHeight}" />`);
  sampledDates(data).forEach((date) => {
    const x = coordinate(scaleX(date));
    add(7, `<line x1="${x}" y1="${plotHeight}" x2="${x}" y2="${plotHeight + 5}" />`);
  });
  add(6, "</g>");
  add(5, "</g>");
  series.forEach((_name, index) => {
    add(5, `<path class="line_chart_line line_chart_series_${index + 1}"`);
    add(6, 'd="');
    linePath(data, index, scaleX, scaleY).forEach((command) => add(7, command));
    add(6, '" />');
  });
  if (xLabel) add(5, `<text class="line_chart_axis_label" x="${plotWidth / 2}" y="${plotHeight + MARGIN.bottom - 8}" text-anchor="middle">${escapeText(xLabel)}</text>`);
  if (yLabel) add(5, `<text class="line_chart_axis_label" transform="rotate(-90)" x="${-plotHeight / 2}" y="${-MARGIN.left + 16}" text-anchor="middle">${escapeText(yLabel)}</text>`);
  if (!staticMode) {
    add(5, `<line class="line_chart_cursor_line" y2="${plotHeight}" visibility="hidden" />`);
    series.forEach((_name, index) =>
      add(5, `<circle class="line_chart_selected_point line_chart_series_${index + 1}" r="4" visibility="hidden" />`));
    add(5, `<rect class="line_chart_interaction_target" width="${plotWidth}" height="${plotHeight}" tabindex="0" aria-label="Use left and right arrow keys to move between data points" />`);
  }
  add(4, "</g>");
  add(3, "</svg>");
  if (!staticMode) {
    add(3, '<div class="line_chart_tooltip" hidden aria-hidden="true">');
    add(4, `<div><span class="line_chart_tooltip_label">${escapeText(xLabel || "Date")}: </span><span data-line_chart_tooltip_date></span></div>`);
    seriesLabels.forEach((name, index) =>
      add(4, `<div><span class="line_chart_tooltip_label">${escapeText(name)}: </span><span data-line_chart_tooltip_series_index="${index}"></span></div>`));
    add(3, "</div>");
  }
  add(2, "</div>");
  if (series.length > 1) {
    add(2, '<ul class="line_chart_legend" aria-label="Chart series">');
    series.forEach((name, index) =>
      add(3, `<li class="line_chart_legend_item line_chart_series_${index + 1}">${escapeText(name)}</li>`));
    add(2, "</ul>");
  }
  add(1, "</figure>");
  if (config.line_chart_source_note) add(1, `<p class="line_chart_source_note">Source: ${escapeText(config.line_chart_source_note)}</p>`);
  add(1, `<details class="line_chart_data"${staticMode ? xmlMode ? ' open="open"' : " open" : ""}>`);
  add(2, "<summary>View chart data</summary>");
  add(2, '<div class="line_chart_data_table">');
  add(3, "<table>");
  add(4, `<caption>Data for ${escapeText(label)}</caption>`);
  add(4, "<thead>");
  add(5, "<tr>");
  [xLabel || "Date", ...seriesLabels].forEach((heading) =>
    add(6, `<th scope="col">${escapeText(heading)}</th>`));
  add(5, "</tr>");
  add(4, "</thead>");
  add(4, "<tbody>");
  data.forEach((point) => {
    const isoDate = point.date.toISOString().slice(0, 10);
    add(5, "<tr>");
    add(6, `<td><time datetime="${isoDate}" data-line_chart_date_label="${escapeAttribute(formatTooltipDate(point.date))}">${isoDate}</time></td>`);
    point.values.forEach((value) => add(6, Number.isFinite(value)
      ? `<td data-line_chart_value="${value}">${numberFormatter.format(value)}</td>`
      : '<td data-line_chart_value="">—</td>'));
    add(5, "</tr>");
  });
  add(4, "</tbody>");
  add(3, "</table>");
  add(2, "</div>");
  const downloadUrl = config.line_chart_download_url || config.line_chart_source_path;
  add(2, `<a class="line_chart_download" href="${escapeAttribute(downloadUrl)}"${xmlMode ? ' download="download"' : " download"}>${staticMode ? "[download csv]" : "Download CSV"}</a>`);
  add(1, "</details>");
  add(0, "</div>");
  return lines.join("\n");
}

function csvPath(outputDirectory, source) {
  const url = new URL(source, "https://academia.invalid/");
  if (url.origin !== "https://academia.invalid") throw new Error("Chart CSV must be a local static file");
  const path = resolve(outputDirectory, decodeURIComponent(url.pathname).replace(/^\/+/, ""));
  const relativePath = relative(outputDirectory, path);
  if (relativePath.startsWith("..") || isAbsolute(relativePath))
    throw new Error(`Chart CSV escapes the output directory: ${source}`);
  return path;
}

const outputDirectory = resolve(process.argv[2] || "public");
let chartCount = 0, fileCount = 0;

async function renderPlaceholders(source, sourceName, staticMode = false, xmlMode = false) {
  const matches = [...source.matchAll(chartPlaceholderPattern)];
  if (matches.length === 0) return { content: source, count: 0 };
  let rendered = "", cursor = 0;

  for (const match of matches) {
    const config = attributes(match[2]);
    if (!config.line_chart_source_path) throw new Error(`Chart in ${sourceName} has no CSV source`);
    let chart;
    try {
      const csv = await readFile(csvPath(outputDirectory, config.line_chart_source_path), "utf8");
      chart = renderChart(config, parseData(parseCsv(csv)), { staticMode, xmlMode });
    } catch (error) {
      throw new Error(`Could not render chart from ${config.line_chart_source_path} in ${sourceName}: ${error.message}`, { cause: error });
    }
    rendered += source.slice(cursor, match.index) + chart.split("\n").map((line) => match[1] + line).join("\n");
    cursor = match.index + match[0].length;
  }
  rendered += source.slice(cursor);
  return { content: rendered, count: matches.length };
}

for (const path of await filesEndingIn(outputDirectory, ".html")) {
  const result = await renderPlaceholders(await readFile(path, "utf8"), path);
  if (result.count === 0) continue;
  await writeFile(path, result.content);
  chartCount += result.count;
  fileCount += 1;
}

for (const path of await filesEndingIn(outputDirectory, ".xml")) {
  const result = await renderPlaceholders(await readFile(path, "utf8"), path, true, true);
  if (result.count === 0) continue;
  await writeFile(path, result.content);
  chartCount += result.count;
  fileCount += 1;
}

console.log(`Rendered ${chartCount} chart(s) from CSV in ${fileCount} file(s).`);
