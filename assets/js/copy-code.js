document.querySelectorAll("pre>code,.highlight pre>code").forEach((c) => {
  const b = document.createElement("button");
  b.className = "copy-code-button";
  b.textContent = "copy";
  b.onclick = async () => {
    await navigator.clipboard.writeText(c.innerText.replace(/\n$/, ""));
    b.textContent = "copied";
    b.classList.add("copied");
    setTimeout(() => {
      b.textContent = "copy";
      b.classList.remove("copied");
    }, 900);
  };
  c.parentElement.appendChild(b);
});
