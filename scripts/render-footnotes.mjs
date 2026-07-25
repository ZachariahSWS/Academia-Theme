import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const outputDirectory = resolve(process.argv[2] || "public");
const definitionPattern = /[ \t]*<div class="footnote-definition" id="([^"]+)"><sup class="footnote-definition-label">[^<]*<\/sup>\s*([\s\S]*?)\s*<\/div>/g;
const referencePattern = /<sup class="footnote-reference"><a href="#([^"]+)">[^<]*<\/a><\/sup>/g;

async function htmlFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory)) {
    const path = resolve(directory, entry);
    const details = await stat(path);
    if (details.isDirectory()) files.push(...(await htmlFiles(path)));
    else if (path.endsWith(".html")) files.push(path);
  }
  return files;
}

function inlineBody(body, id) {
  const trimmed = body.trim();
  const paragraph = /^<p>([\s\S]*)<\/p>$/.exec(trimmed);
  if (!paragraph) {
    throw new Error(`Footnote "${id}" must contain one paragraph`);
  }
  return paragraph[1];
}

let noteCount = 0, fileCount = 0;

for (const path of await htmlFiles(outputDirectory)) {
  const source = await readFile(path, "utf8");
  const definitions = new Map();
  let rendered = source.replace(definitionPattern, (_definition, id, body) => {
    definitions.set(id, inlineBody(body, id));
    return "";
  });
  let notesInFile = 0;

  rendered = rendered.replace(referencePattern, (reference, id) => {
    const body = definitions.get(id);
    if (body === undefined) return reference;

    notesInFile += 1;
    const toggleId = `note_toggle_${notesInFile}`;
    if (/^\d+$/.test(id)) {
      return `<label for="${toggleId}" class="note_toggle_label side_note_reference" data-side_note_marker="${id}" aria-label="Show side note ${id}"></label><input type="checkbox" id="${toggleId}" class="note_toggle_input" /><span class="side_note" data-side_note_marker="${id}">${body}</span>`;
    }
    return `<label for="${toggleId}" class="note_toggle_label margin_note_reference" aria-label="Show side note">†</label><input type="checkbox" id="${toggleId}" class="note_toggle_input" /><span class="margin_note">${body}</span>`;
  });

  if (rendered !== source) await writeFile(path, rendered);
  if (notesInFile > 0) {
    noteCount += notesInFile;
    fileCount += 1;
  }
}

console.log(`Rendered ${noteCount} Markdown sidenote(s) in ${fileCount} file(s).`);
