document.addEventListener("DOMContentLoaded", function () {
  const navPlaceholder = document.getElementById("nav-placeholder");

  // 同時載入 navbar 與 sidebar
  Promise.all([
    fetch("nav.html").then(response => response.text()),
    fetch("sidebar.html").then(response => response.text())
  ]).then(([navData, sidebarData]) => {
    navPlaceholder.innerHTML = navData;
    sidebarPlaceholder.innerHTML = sidebarData;

    updateNavbar();  // Navbar 載入後更新 UI
    initSearchBar(); // 初始化搜尋框
    initSidebar();   // 初始化 Sidebar 點擊事件
  }).catch(error => console.error("Failed to load components:", error));
});

// 更新 Navbar UI（登入 / 未登入）
function updateNavbar() {
  const navActions = document.getElementById("navActions");

  if (!navActions) {
    console.error("navActions not found!");
    return;
  }

  const isLoggedIn = localStorage.getItem("loggedIn") === "true";

  if (isLoggedIn) {
    // 已登入 UI
    navActions.innerHTML = `
      <div class="right-icon-btn">
        <button class="icon-btn" onclick="logout()">
          <div class="avator"></div>
        </button>
        <button class="btn-icon-full-r">
          <img src="/asset/image/Icon/Type=Notice.svg" alt="Notice">
        </button>
        <button class="btn-icon-full-r">
          <img src="/asset/image/Icon/Type=message.svg" class="icon" alt="message">
        </button>
        <button class="btn-grey-full-r btn-icon-left">
          <img src="/asset/image/Icon/Type=add.svg" class="icon" alt="">Create
        </button>
      </div>
    `;
  } else {
    // 未登入 UI
    navActions.innerHTML = `
      <div class="right-icon-btn">
        <button class="btn-primary-full-r" onclick="login()">Signup / Signin</button>
      </div>
    `;
  }
}

// **搜尋框清除按鈕功能**
function initSearchBar() {
  const searchInput = document.querySelector(".nav-search-input");
  const clearIcon = document.querySelector(".clear-icon");

  if (searchInput && clearIcon) {
    searchInput.addEventListener("input", function () {
      clearIcon.style.display = searchInput.value ? "block" : "none";
    });

    clearIcon.addEventListener("click", function () {
      searchInput.value = "";
      clearIcon.style.display = "none";
      searchInput.focus();
    });
  } else {
    console.error("nav-search-input or clear-icon not found");
  }
}

// **讓 `login()` 和 `logout()` 成為全域函式**
window.login = function () {
  console.log("Logging in...");
  localStorage.setItem("loggedIn", "true");
  updateNavbar();
};

window.logout = function () {
  console.log("Logging out...");
  localStorage.setItem("loggedIn", "false");
  updateNavbar();
};
