document.getElementsByTagName("html")[0].style.visibility = "hidden";
window.addEventListener("load", function () {
  if (this.window.location.pathname == "/login.html") {
    checkUser();
  } else {
    checkUserNormal();
  }
  document.getElementsByTagName("html")[0].style.visibility = "visibile";
});

function setHrefs() {
  const auth = localStorage.getItem("a_k");
  console.log(document.getElementById("indexx"));
  document
    .getElementById("indexx")
    .setAttribute("href", "index.html?a_k=" + auth);
  document
    .getElementById("noti")
    .setAttribute("href", "notific.html?a_k=" + auth);
  document
    .getElementById("users")
    .setAttribute("href", "usersandbanks.html?a_k=" + auth);

  document
    .getElementById("indexx1")
    .setAttribute("href", "index.html?a_k=" + auth);
  document
    .getElementById("noti1")
    .setAttribute("href", "notific.html?a_k=" + auth);
  document
    .getElementById("users1")
    .setAttribute("href", "usersandbanks.html?a_k=" + auth);
}
async function checkUser() {
  const auth = localStorage.getItem("a_k");
  if (auth) {
    //window.location.href = "/index.html?a_k=" + localStorage.getItem("a_k");
    localStorage.clear();
    document.getElementsByTagName("html")[0].style.visibility = "visible";
  } else {
    localStorage.clear();
    document.getElementsByTagName("html")[0].style.visibility = "visible";
  }
}
async function checkUserNormal() {
  const auth = localStorage.getItem("a_k");
  if (!auth) {
    window.location.href = "/login.html";
  } else {
    document.getElementsByTagName("html")[0].style.visibility = "visible";
    setHrefs();
  }
}

function logout() {
  localStorage.clear();
  window.location.href = "/login.html";
}
