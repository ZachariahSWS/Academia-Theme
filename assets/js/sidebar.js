// sidebar.js
const sidebarLists = {
  chapters: [
    { title: "Foreword", id: "foreword" },
    { title: "Chapter 1: Title", id: "chapter1" },
    { title: "Chapter 2: Title", id: "chapter2" },
    // Add more chapters as needed
  ],
  essays: [
    { title: "High Speed Rail", id: "high-speed-rail" },
    { title: "Treasury Prediction Markets", id: "treasury-prediction-markets" },
  ],
};

function generateSidebar(listType) {
  const sidebar = document.getElementById("sidebar");
  const ul = document.createElement("ul");

  if (!sidebarLists[listType]) {
    console.error(`Sidebar list type "${listType}" not found.`);
    return;
  }

  sidebarLists[listType].forEach((item) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.textContent = item.title;
    a.href = `${item.id}.html`;
    a.classList.add("internal-link");
    li.appendChild(a);
    ul.appendChild(li);
  });

  sidebar.appendChild(ul);
}

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  if (sidebar) {
    const listType = sidebar.getAttribute("data-list-type");
    if (listType) {
      generateSidebar(listType);
    } else {
      console.error("No list type specified for sidebar.");
    }
  }
});
