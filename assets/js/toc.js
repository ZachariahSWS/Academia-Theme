function generateToC() {
  const tocWrapper = document.createElement("div");
  tocWrapper.className = "toc-wrapper";
  const toc = document.createElement("ul");
  toc.className = "toc";

  const mainContent = document.querySelector(".main-content");
  const headings = mainContent.querySelectorAll("h1, h2, h3");
  headings.forEach((heading, index) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.textContent = heading.textContent;
    a.href = `#heading-${index}`;
    heading.id = `heading-${index}`;
    li.appendChild(a);
    toc.appendChild(li);
  });

  tocWrapper.appendChild(toc);

  const contentWrapper = document.querySelector(".content-wrapper");
  contentWrapper.insertBefore(tocWrapper, contentWrapper.firstChild);
}

function updateActiveToC() {
  const mainContent = document.querySelector(".main-content");
  const headings = mainContent.querySelectorAll("h1, h2, h3");
  const tocLinks = document.querySelectorAll(".toc a");

  let currentActiveIndex = -1;

  headings.forEach((heading, index) => {
    const rect = heading.getBoundingClientRect();
    if (rect.top <= 100) {
      currentActiveIndex = index;
    }
  });

  tocLinks.forEach((link, index) => {
    if (index === currentActiveIndex) {
      link.classList.add("active");
      link.setAttribute("aria-current", "true");
    } else {
      link.classList.remove("active");
      link.removeAttribute("aria-current");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  generateToC();
  window.addEventListener("scroll", updateActiveToC);
});
