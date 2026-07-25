(() => {
  document.querySelectorAll("pre>code").forEach((code) => code.insertAdjacentHTML("afterend", '<button class="copy_button copy_code_button" type="button" aria-label="Copy code" title="Copy code"><svg aria-hidden="true"><use href="#copy_icon_symbol"></use></svg></button>'));
  const tableButton = '<button class="copy_button copy_table_button" type="button" aria-label="Copy table as TSV" title="Copy table as TSV"><svg aria-hidden="true"><use href="#copy_icon_symbol"></use></svg><span aria-hidden="true">TSV</span></button>';
  document.querySelectorAll("table").forEach((table) => {
    const wrapper = document.createElement("div");
    wrapper.className = "table_copy_container";
    table.before(wrapper);
    wrapper.append(table);
    if (table.caption) {
      const row = document.createElement("span");
      const label = document.createElement("span");
      row.className = "table_caption_content";
      while (table.caption.firstChild) label.append(table.caption.firstChild);
      row.append(label);
      row.insertAdjacentHTML("beforeend", tableButton);
      table.caption.append(row);
    } else {
      wrapper.insertAdjacentHTML("afterbegin", `<div class="table_copy_controls">${tableButton}</div>`);
    }
  });
  const decode = (value) => new TextDecoder().decode(Uint8Array.from(atob(value), (character) => character.charCodeAt(0)));
  const tableToTsv = (table) => Array.from(table.rows, (row) =>
    Array.from(row.cells, (cell) => cell.innerText.replace(/[\t\r\n]+/g, " ").trim()).join("\t")
  ).join("\n");
  document.addEventListener("click", async (event) => {
    const control = event.target.closest?.(".copy_button, .rendered_math_inline[data-math_source]");
    if (!control) return;
    const tableButton = control.classList.contains("copy_table_button");
    const text = control.dataset.math_source
      ? decode(control.dataset.math_source)
      : tableButton
        ? tableToTsv(control.closest(".table_copy_container").querySelector("table"))
        : control.previousElementSibling.innerText.replace(/\n$/, "");
    const label = control.classList.contains("copy_code_button")
      ? "Copy code"
      : tableButton ? "Copy table as TSV" : "Copy LaTeX";
    await navigator.clipboard.writeText(text);
    control.classList.add("copy_confirmed"); control.setAttribute("aria-label", "Copied");
    setTimeout(() => { control.classList.remove("copy_confirmed"); control.setAttribute("aria-label", label); }, 900);
  });
  document.addEventListener("keydown", (event) => {
    if (event.target.matches?.(".rendered_math_inline") && ["Enter", " "].includes(event.key)) {
      event.preventDefault(); event.target.click();
    }
  });
})();
