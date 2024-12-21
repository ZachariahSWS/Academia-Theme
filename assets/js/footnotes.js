document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("footnote-popup");
  const popupContent = popup.querySelector(".footnote-content");
  const closeBtn = popup.querySelector(".close-btn");
  const mainContent = document.querySelector(".main-content");

  const showPopup = (footnote) => {
    // First, make sure we have the content
    popupContent.innerHTML = footnote.getAttribute("data-footnote");

    // Make sure the popup is initially visible
    popup.style.display = "block";

    // Position relative to the main content
    const mainContentRect = mainContent.getBoundingClientRect();

    Object.assign(popup.style, {
      position: "fixed", // Changed to fixed positioning
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "90%",
      maxWidth: `${mainContentRect.width * 0.9}px`, // 90% of main content width
      maxHeight: "80vh",
      overflowY: "auto",
      zIndex: "1000", // Ensure it appears above other content
    });
  };

  // Event listener for clicking footnotes
  document.addEventListener("click", (e) => {
    const clickedFootnote = e.target.closest(".footnote");
    if (clickedFootnote) {
      e.preventDefault();
      showPopup(clickedFootnote);
    } else if (!popup.contains(e.target)) {
      popup.style.display = "none";
    }
  });

  // Close button functionality
  closeBtn.addEventListener("click", () => {
    popup.style.display = "none";
  });

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
