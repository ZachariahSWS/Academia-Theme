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

  let rendered = html.replace(
    mathSourcePattern,
    (_source, element, encodedTex, display) => {
      const tex = Buffer.from(encodedTex, "base64").toString("utf8");
      const displayMode = display === "true";
      const mathml = temml.renderToString(tex, { displayMode, throwOnError: true });
      const wrapper = displayMode ? "div" : element;
      const mode = displayMode ? "display" : "inline";
      const wrapperAttributes = displayMode
        ? ""
        : ` data-math_source="${encodedTex}" role="button" tabindex="0" aria-label="Copy LaTeX"`;
      const copyButton = displayMode
        ? `<button class="copy_button copy_math_button" type="button" data-math_source="${encodedTex}" aria-label="Copy LaTeX" title="Copy LaTeX"><svg aria-hidden="true"><use href="#copy_icon_symbol"></use></svg></button>`
        : "";
      equationsInFile += 1;
      return `<${wrapper} class="rendered_math rendered_math_${mode}"${wrapperAttributes}>${mathml}${copyButton}</${wrapper}>`;
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
