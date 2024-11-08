document.addEventListener("DOMContentLoaded", () => {
  const progressBar = document.querySelector(".scroll-progress-bar");

  function updateProgressBar() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    const scrollableHeight = documentHeight - windowHeight;
    const scrollProgress = (scrollTop / scrollableHeight) * 100;

    progressBar.style.width = scrollProgress + "%";
  }

  // Update on load
  updateProgressBar();

  // Update on scroll
  window.addEventListener("scroll", updateProgressBar);

  // Update on resize
  window.addEventListener("resize", updateProgressBar);
});
