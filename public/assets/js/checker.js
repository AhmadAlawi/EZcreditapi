window.addEventListener("load", function () {
  document.getElementById("formnew").addEventListener("submit", function (e) {
    e.preventDefault();
    console.log("submitted");
    loginU(e.target[0].value, e.target[1].value);
  });
});

async function loginU(email, pass) {
  let response = await fetch(
    "api/dashboard/login_admin?em=" + email + "&ps=" + pass
  );
  if (response.ok) {
    let json = await response.json();
    console.log(json);
    localStorage.setItem("a_k", json.data);
    window.location.href = "/index.html?a_k=" + localStorage.getItem("a_k");
  } else {
    alert("Error " + response.status);
  }
}
