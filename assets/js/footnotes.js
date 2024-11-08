document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("footnote-popup");
  const popupContent = popup.querySelector(".footnote-content");
  const closeBtn = popup.querySelector(".close-btn");
  const mainContent = document.querySelector(".main-content");
  const getPixelsPerRem = () => {
    return parseFloat(getComputedStyle(document.documentElement).fontSize);
  };
  const rem = getPixelsPerRem();

  const isMobile = () => window.innerWidth <= 48 * rem;

  const showPopup = (footnote) => {
    popupContent.innerHTML = footnote.getAttribute("data-footnote");
    popup.style.display = "block";
    positionPopup(footnote);
  };

  const positionPopup = (footnote) => {
    if (isMobile()) {
      Object.assign(popup.style, {
        position: "fixed",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: "calc(100% - 2rem)",
        maxWidth: "90%",
        maxHeight: "80vh",
        margin: "0 auto",
      });
    } else {
      const viewportWidth = document.documentElement.clientWidth;
      const mainContentRect = mainContent.getBoundingClientRect();
      const footnoteRect = footnote.getBoundingClientRect();

      const maxWidth = Math.min(25 * rem, viewportWidth * 0.3); // 25rem = 400px
      const rightPadding = 1.25 * rem;

      Object.assign(popup.style, {
        position: "absolute",
        left: "auto",
        right: `${rightPadding}rem`,
        top: `${(footnoteRect.top + window.scrollY) / 16}rem`,
        transform: "none",
        width: "auto",
        maxWidth: `${maxWidth}rem`,
        maxHeight: "60vh",
        margin: "0",
      });

      // Adjust vertical position if popup goes beyond viewport
      const popupRect = popup.getBoundingClientRect();
      if (popupRect.bottom > window.innerHeight) {
        popup.style.top = `${(window.innerHeight + window.scrollY - popupRect.height - rightPadding * 16) / 16}rem`;
      }
    }
  };

  document.addEventListener("click", (e) => {
    const clickedFootnote = e.target.closest(".footnote");
    if (clickedFootnote) {
      e.preventDefault();
      showPopup(clickedFootnote);
    } else if (!popup.contains(e.target)) {
      popup.style.display = "none";
    }
  });

  closeBtn.addEventListener("click", () => (popup.style.display = "none"));

  window.addEventListener("resize", () => {
    if (popup.style.display === "block") {
      const activeFootnote = document.querySelector(".footnote:hover");
      activeFootnote
        ? showPopup(activeFootnote)
        : (popup.style.display = "none");
    }
  });
});
