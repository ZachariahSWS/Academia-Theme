document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("footnote-popup");
  const popupContent = popup.querySelector(".footnote-content");
  const closeBtn = popup.querySelector(".close-btn");
  const mainContent = document.querySelector(".main-content");

  const showPopup = (footnote) => {
    popupContent.innerHTML = footnote.getAttribute("data-footnote");
    popup.style.display = "block";

    const mainContentRect = mainContent.getBoundingClientRect();
    const MARGIN = 20;

    // Always position the popup in the center of main-content
    Object.assign(popup.style, {
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      width: "90%", // Always 90% of main-content
      maxHeight: "80vh",
      overflowY: "auto",
    });
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
