// load navbar
fetch("nav.html")
  .then(response => response.text()) // load nav.html content
  .then(data => {
    document.getElementById("nav-placeholder").innerHTML = data;
  })
  .catch(error => console.error("Error loading nav:", error));