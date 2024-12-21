document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("footnote-popup");
  const popupContent = popup.querySelector(".footnote-content");
  const closeBtn = popup.querySelector(".close-btn");
  const isMobile = () => window.innerWidth <= 768; // 48rem

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
      });
    } else {
      const rect = footnote.getBoundingClientRect();
      Object.assign(popup.style, {
        position: "fixed",
        left: `${rect.right + 20}px`,
        top: `${rect.top}px`,
        transform: "none",
        width: "400px",
        maxWidth: "30vw",
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
});
