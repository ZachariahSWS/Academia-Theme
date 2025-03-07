document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("footnote-popup");
  const popupContent = popup.querySelector(".footnote-content");
  const closeBtn = popup.querySelector(".close-btn");
  const mainContent = document.querySelector(".main-content");
  const contentWrapper = document.querySelector(".content-wrapper");

  // Ensure all necessary elements exist
  if (!popup || !popupContent || !closeBtn || !mainContent || !contentWrapper) {
    console.error("Missing required elements for footnote popup");
    return;
  }

  let activeFootnote = null;
  
  // Function to check if we're on a large screen - setting a higher threshold to ensure 
  // popup appears below text more often, only going to the right on very large screens
  const isLargeScreen = () => {
    return window.matchMedia("(min-width: 65rem)").matches;
  };

  const showPopup = (footnote) => {
    // Set the content of the popup
    popupContent.innerHTML = footnote.getAttribute("data-footnote");

    // Position the popup relative to the footnote
    positionPopup(footnote);
    
    // Make the popup visible by adding the 'visible' class
    popup.classList.add("visible");
    popup.classList.remove("hidden");
    
    // Store the active footnote
    activeFootnote = footnote;
  };

  const positionPopup = (footnote) => {
    // Get footnote position
    const footnoteRect = footnote.getBoundingClientRect();
    const mainContentRect = mainContent.getBoundingClientRect();
    
    // Check if we're on a large screen (>50rem)
    if (isLargeScreen()) {
      // Position the popup vertically aligned with the footnote text
      // Calculate the vertical position relative to the main content
      const relY = footnoteRect.top - mainContentRect.top;
      
      // Set vertical position aligned with the footnote
      popup.style.top = `${relY}px`;
      
      // CSS handles the horizontal positioning with left: calc(100% + 1rem)
      // But we set the width explicitly
      popup.style.width = `20rem`;
      
      // Ensure we don't have any inline styles that might interfere with our media query
      popup.style.left = ""; // Let CSS handle this
      popup.style.right = "";
    } else {
      // For smaller screens, position below the footnote
      // Get the computed styles to account for padding
      const computedStyle = window.getComputedStyle(mainContent);
      const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
      const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
      
      // Make popup width match the text content width (accounting for padding)
      const textWidth = mainContentRect.width - paddingLeft - paddingRight;
      popup.style.width = `${textWidth}px`;
      
      // Calculate the vertical position from the bottom of the footnote
      const relY = footnoteRect.bottom - mainContentRect.top + 5; // Add a small spacing
      
      // Position the popup below the footnote
      popup.style.top = `${relY}px`;
      popup.style.left = `${paddingLeft}px`;
      
      // Make sure the right property doesn't interfere
      popup.style.right = 'auto';
    }
  };

  const hidePopup = () => {
    // Hide the popup by removing the 'visible' class
    popup.classList.remove("visible");
    popup.classList.add("hidden");
    activeFootnote = null;
    
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
    if (popup.classList.contains("visible") && activeFootnote) {
      positionPopup(activeFootnote);
    }
  });
  
  // Update popup position on scroll to keep it visible
  window.addEventListener("scroll", () => {
    if (popup.classList.contains("visible") && activeFootnote) {
      positionPopup(activeFootnote);
    }
  });
});
