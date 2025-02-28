// load navbar
fetch("nav.html")
  .then(response => response.text()) // 讀取 nav.html 內容
  .then(data => {
    document.getElementById("nav-placeholder").innerHTML = data;
  })
  .catch(error => console.error("Error loading nav:", error));