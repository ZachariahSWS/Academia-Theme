document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("footnote-popup");
  const popupContent = popup.querySelector(".footnote-content");
  const closeBtn = popup.querySelector(".close-btn");
  const mainContent = document.querySelector(".main-content");
  const isMobile = () => window.innerWidth <= 768;

  const showPopup = (footnote) => {
    popupContent.innerHTML = footnote.getAttribute("data-footnote");
    popup.style.display = "block";

    if (isMobile()) {
      Object.assign(popup.style, {
        position: "absolute",
        left: "50%",
        top: `${window.scrollY + window.innerHeight / 2}px`,
        transform: "translate(-50%, -50%)",
        width: "calc(100% - 2rem)",
        maxWidth: "90%",
        maxHeight: "80vh",
        overflowY: "auto",
      });
    } else {
      const footnoteRect = footnote.getBoundingClientRect();
      const mainContentRect = mainContent.getBoundingClientRect();
      const MARGIN = 20;
      const POPUP_WIDTH = 400;

      // Calculate position relative to main content
      let leftPos = footnoteRect.right - mainContentRect.left + MARGIN;
      if (leftPos + POPUP_WIDTH > mainContentRect.width - MARGIN) {
        leftPos =
          footnoteRect.left - mainContentRect.left - POPUP_WIDTH - MARGIN;
      }
      if (leftPos < MARGIN) {
        leftPos = MARGIN;
      }

      let topPos = footnoteRect.top - mainContentRect.top;
      const maxHeight = Math.min(window.innerHeight * 0.8, 400);
      if (topPos + maxHeight > mainContentRect.height - MARGIN) {
        topPos = mainContentRect.height - maxHeight - MARGIN;
      }
      if (topPos < MARGIN) {
        topPos = MARGIN;
      }

      Object.assign(popup.style, {
        position: "absolute",
        left: `${leftPos}px`,
        top: `${topPos}px`,
        transform: "none",
        width: `${POPUP_WIDTH}px`,
        maxWidth: "30vw",
        maxHeight: `${maxHeight}px`,
        overflowY: "auto",
      });
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

  // Handle window resize
  window.addEventListener("resize", () => {
    if (popup.style.display === "block") {
      const activeFootnote = document.querySelector(".footnote:hover");
      if (activeFootnote) {
        showPopup(activeFootnote);
      }
    }
  });
});
