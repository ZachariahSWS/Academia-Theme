import { createRequire } from "node:module";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";

const require = createRequire(import.meta.url);
const temml = require("temml");

const outputDirectory = resolve(process.argv[2] || "public");
const contentDirectory = resolve(outputDirectory, "..", "content");
const mathSourcePattern = /<(span|div) class="math_source" data-math_source="([A-Za-z0-9+/=]+)" data-math_is_display="(true|false)">[\s\S]*?<\/\1>/g;
const temmlStylesheetPattern = /^[ \t]*<!-- temml_stylesheet:([^\s]+) -->[ \t]*\r?\n?/m;
const markdownSourcePattern = /<meta name="markdown-source" content="([^"]+)">/;
const excludedElementPattern = /<(pre|code|script|style)\b[\s\S]*?<\/\1\s*>/gi;
const htmlTagPattern = /(?:<!--[\s\S]*?-->|<![^>]*>|<[^>]*>)/g;
const mathDelimiterPattern = /\\\(([\s\S]*?)\\\)|\$\$([\s\S]*?)\$\$/g;

function decodeHtmlEntities(value) {
  return value
    .replace(/&#(\d+);/g, (_entity, codePoint) =>
      String.fromCodePoint(Number(codePoint)))
    .replace(/&#x([0-9a-f]+);/gi, (_entity, codePoint) =>
      String.fromCodePoint(Number.parseInt(codePoint, 16)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function renderEquation(tex, displayMode, element = "span") {
  const encodedTex = Buffer.from(tex).toString("base64");
  const mathml = temml.renderToString(tex, { displayMode, throwOnError: true });
  const wrapper = displayMode ? "div" : element;
  const mode = displayMode ? "display" : "inline";
  const wrapperAttributes = displayMode
    ? ""
    : ` data-math_source="${encodedTex}" role="button" tabindex="0" aria-label="Copy LaTeX"`;
  const copyButton = displayMode
    ? `<button class="copy_button copy_math_button" type="button" data-math_source="${encodedTex}" aria-label="Copy LaTeX" title="Copy LaTeX"><svg aria-hidden="true"><use href="#copy_icon_symbol"></use></svg></button>`
    : "";
  return `<${wrapper} class="rendered_math rendered_math_${mode}"${wrapperAttributes}>${mathml}${copyButton}</${wrapper}>`;
}

function renderDelimitedMath(html, onEquation) {
  const renderMatch = (_source, inlineTex, displayTex) => {
    const displayMode = displayTex !== undefined;
    const tex = decodeHtmlEntities(displayMode ? displayTex : inlineTex);
    onEquation();
    return renderEquation(tex, displayMode);
  };
  const renderText = (text) => text.replace(mathDelimiterPattern, renderMatch);
  const renderTextNodes = (source) => {
    const fragment = source.replace(
      /<p>\s*\$\$([\s\S]*?)\$\$\s*<\/p>/g,
      (match, displayTex) => renderMatch(match, undefined, displayTex),
    );
    let output = "";
    let lastIndex = 0;

    for (const match of fragment.matchAll(htmlTagPattern)) {
      output += renderText(fragment.slice(lastIndex, match.index));
      output += match[0];
      lastIndex = match.index + match[0].length;
    }

    return output + renderText(fragment.slice(lastIndex));
  };

  let output = "";
  let lastIndex = 0;
  for (const match of html.matchAll(excludedElementPattern)) {
    output += renderTextNodes(html.slice(lastIndex, match.index));
    output += match[0];
    lastIndex = match.index + match[0].length;
  }
  return output + renderTextNodes(html.slice(lastIndex));
}

async function htmlFiles(directory) {
  const entries = await readdir(directory);
  const files = [];

  for (const entry of entries) {
    const path = resolve(directory, entry);
    const details = await stat(path);

    if (details.isDirectory()) {
      files.push(...(await htmlFiles(path)));
    } else if (path.endsWith(".html")) {
      files.push(path);
    }
  }

  return files;
}

let equationCount = 0, fileCount = 0, markdownCount = 0;

for (const path of await htmlFiles(outputDirectory)) {
  const html = await readFile(path, "utf8");
  let equationsInFile = 0;
  const encodedMarkdownSource = html.match(markdownSourcePattern)?.[1];

  if (encodedMarkdownSource) {
    const markdownSource = Buffer.from(encodedMarkdownSource, "base64").toString("utf8");
    const sourcePath = resolve(contentDirectory, markdownSource);
    const relativeSourcePath = relative(contentDirectory, sourcePath);
    if (relativeSourcePath.startsWith("..") || isAbsolute(relativeSourcePath)) {
      throw new Error(`Markdown source escapes the content directory: ${markdownSource}`);
    }

    let outputPath = path.replace(/\.html$/, ".md");
    if (basename(path) === "index.html" && dirname(path) !== outputDirectory)
      outputPath = resolve(dirname(dirname(path)), `${basename(dirname(path))}.md`);
    await writeFile(outputPath, await readFile(sourcePath));
    markdownCount += 1;
  }

  let rendered = renderDelimitedMath(html, () => {
    equationsInFile += 1;
  });

  rendered = rendered.replace(
    mathSourcePattern,
    (_source, element, encodedTex, display) => {
      const tex = Buffer.from(encodedTex, "base64").toString("utf8");
      const displayMode = display === "true";
      equationsInFile += 1;
      return renderEquation(tex, displayMode, element);
    },
  );

  rendered = rendered.replace(
    temmlStylesheetPattern,
    equationsInFile > 0
      ? (_marker, href) => `    <link rel="preload" href="${href}" as="style" fetchpriority="high" data-math_stylesheet onload="this.onload=null;this.rel='stylesheet'">\n    <noscript><link rel="stylesheet" href="${href}"></noscript>\n`
      : "",
  );

  rendered = rendered.replace(/<pre\b[\s\S]*?<\/pre>/g, (block) =>
    block.replace(/\n {12}/g, "\n"));

  if (rendered !== html) await writeFile(path, rendered);

  if (equationsInFile > 0) {
    equationCount += equationsInFile;
    fileCount += 1;
  }
}

console.log(`Rendered ${equationCount} equation(s) to MathML in ${fileCount} file(s).`);
console.log(`Published ${markdownCount} raw Markdown source file(s).`);
