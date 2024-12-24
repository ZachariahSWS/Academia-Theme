document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("footnote-popup");
  const popupContent = popup.querySelector(".footnote-content");
  const closeBtn = popup.querySelector(".close-btn");
  const mainContent = document.querySelector(".main-content");

  // Ensure all necessary elements exist
  if (!popup || !popupContent || !closeBtn || !mainContent) return;

  const showPopup = (footnote) => {
    // Set the content of the popup
    popupContent.innerHTML = footnote.getAttribute("data-footnote");

    // Make the popup visible by adding the 'visible' class
    popup.classList.add("visible");
    popup.classList.remove("hidden");
  };

  const hidePopup = () => {
    // Hide the popup by removing the 'visible' class
    popup.classList.remove("visible");
    popup.classList.add("hidden");
  };

  // Event listener for clicking footnotes
  document.addEventListener("click", (e) => {
    const clickedFootnote = e.target.closest(".footnote");

    if (clickedFootnote) {
      e.preventDefault();
      showPopup(clickedFootnote);
      return; // Exit to prevent hiding the popup immediately
    }

    // Hide the popup if the click is outside the popup
    if (!popup.contains(e.target)) {
      hidePopup();
    }
  });

  // Close button functionality
  closeBtn.addEventListener("click", () => {
    hidePopup();
  });

  // Handle window resize to adjust popup if necessary
  window.addEventListener("resize", () => {
    if (popup.classList.contains("visible")) {
      const activeFootnote = document.querySelector(".footnote:hover");
      if (activeFootnote) {
        showPopup(activeFootnote);
      }
    }
  });
});
