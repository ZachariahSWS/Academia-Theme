document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("footnote-popup");
  const popupContent = popup.querySelector(".footnote-content");
  const closeBtn = popup.querySelector(".close-btn");
  const isMobile = () => window.innerWidth <= 768;

  const showPopup = (footnote) => {
    popupContent.innerHTML = footnote.getAttribute("data-footnote");
    popup.style.display = "block";

    if (isMobile()) {
      Object.assign(popup.style, {
        position: "fixed",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: "calc(100% - 2rem)",
        maxWidth: "90%",
        maxHeight: "80vh", // Add max height
        overflowY: "auto", // Enable scrolling
      });
    } else {
      const rect = footnote.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const MARGIN = 20; // Margin from viewport edges
      const POPUP_WIDTH = 400;

      // Calculate horizontal position
      let leftPos = rect.right + MARGIN;
      // If popup would go off right edge, position to the left of the footnote
      if (leftPos + POPUP_WIDTH > viewportWidth - MARGIN) {
        leftPos = rect.left - POPUP_WIDTH - MARGIN;
      }
      // If still off-screen (rare case), align with left viewport edge
      if (leftPos < MARGIN) {
        leftPos = MARGIN;
      }

      // Calculate vertical position
      let topPos = rect.top;
      // If popup would go off bottom, align to bottom of viewport
      if (topPos + popup.offsetHeight > viewportHeight - MARGIN) {
        topPos = viewportHeight - popup.offsetHeight - MARGIN;
      }
      // If top would go above viewport, align to top of viewport
      if (topPos < MARGIN) {
        topPos = MARGIN;
      }

      Object.assign(popup.style, {
        position: "fixed",
        left: `${leftPos}px`,
        top: `${topPos}px`,
        transform: "none",
        width: `${POPUP_WIDTH}px`,
        maxWidth: "30vw",
        maxHeight: "80vh", // Add max height
        overflowY: "auto", // Enable scrolling
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
