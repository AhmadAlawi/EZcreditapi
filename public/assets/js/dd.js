var usersPage = 1;
var banksPage = 1;

function onLoadPage() {
  getPagedUsersData();
  getPagedBanksData();
}

async function getPagedUsersData() {
  fetch("api/dashboard/get_us?page=" + usersPage, {
    method: "GET",
    headers: {
      auth: localStorage.getItem("a_k"),
      "Content-type": "application/json; charset=UTF-8",
    },
  })
    .then(function (response) {
      if (response.status == 401) logout();
      if (response.ok) {
        return response.json();
      }
      return Promise.reject(response);
    })
    .then(function (data) {
      console.log(data);
      renderUsersData(data.data);
      handleMeta1(data.meta);
    })
    .catch(function (error) {
      console.warn("Something went wrong.", error);
    });
}
function getPagedBanksData() {
  fetch("api/dashboard/get_bs?page=" + banksPage, {
    method: "GET",
    headers: {
      auth: localStorage.getItem("a_k"),
    },
  })
    .then(function (response) {
      if (response.status == 401) logout();
      if (response.ok) {
        return response.json();
      }
      return Promise.reject(response);
    })
    .then(function (data) {
      console.log(data);
      renderBankssData(data.data);
      handleMeta2(data.meta);
    })
    .catch(function (error) {
      console.warn("Something went wrong.", error);
    });
}

function renderBankssData(data) {
  data.forEach((element) => {
    const dda = new Date(element.created_at);
    const dd = `${dda.getFullYear()}-${dda.getMonth()}-${dda.getDay()}`;

    const row = `<tr class="text-gray-700 dark:text-gray-400">
                      <td class="px-4 py-3">
                        <div class="flex items-center text-sm">
                          <!-- Avatar with inset shadow -->
                          <div
                            class="relative hidden w-8 h-8 mr-3 rounded-full md:block"
                          >
                            <img
                              class="object-cover w-full h-full rounded-full"
                              src=${element.logo_url}
                              alt=""
                              loading="lazy"
                            />
                            <div
                              class="absolute inset-0 rounded-full shadow-inner"
                              aria-hidden="true"
                            ></div>
                          </div>
                          <div>
                            <p class="font-semibold dark:text-gray-400">${
                              element.id
                            }</p>
                          </div>
                        </div>
                      </td>
                      <td class="px-4 py-3 text-sm dark:text-gray-400">${
                        element.bankname_en
                      }</td>
                      <td class="px-4 py-3 text-xs dark:text-gray-400">
                        <span
                          class="px-2 py-1 font-semibold leading-tight text-green-700  ${
                            element.bank_type == "islamic"
                              ? "bg-orange-100"
                              : "bg-green-100"
                          }  rounded-full dark:bg-green-700 dark:text-green-100"
                        >
                          ${element.bank_type}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-sm dark:text-gray-400">${
                        element.email
                      }</td>
                      <td class="px-4 py-3 text-sm dark:text-gray-400">${dd}</td>
                    </tr>`;
    const newRow = document.createElement("tr");
    newRow.innerHTML = row;

    document.getElementById("tbody2").appendChild(newRow);
  });
}

function renderUsersData(data) {
  document.getElementById("tablebody1").innerHTML = "";
  data.forEach((element) => {
    const dda = new Date(element.created_at);
    dda.toLocaleDateString;
    const dd = dda.toLocaleDateString("default", {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      year: "numeric",
    });
    const row = `<tr class="text-gray-700 dark:text-gray-400">
                    <td class="px-4 py-3">
                      <div class="flex items-center text-sm">
                        <!-- Avatar with inset shadow -->
                        <div>
                          <p class="font-semibold  dark:text-gray-400">${
                            element.id
                          }</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-sm  dark:text-gray-400">${
                      element.fullname_en
                    }</td>
                    <td class="px-4 py-3 text-xs  dark:text-gray-400">
                      <span
                        class="px-2 py-1 font-semibold leading-tight text-green-700  ${
                          element.gender == "female"
                            ? "bg-red-100"
                            : "bg-blue-100"
                        }  rounded-full dark:bg-green-700 dark:text-green-100"
                      >
                        ${element.gender}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-sm  dark:text-gray-400">${
                      element.email
                    }</td>
                    <td class="px-4 py-3 text-sm  dark:text-gray-400">${dd}</td>
                  </tr>`;
    const newRow = document.createElement("tr");
    newRow.innerHTML = row;

    document.getElementById("tablebody1").appendChild(newRow);
  });
}
function handleMeta1(meta) {
  document.getElementById(
    "tableMeta1"
  ).innerText = `Showing ${meta.page_items} out of ${meta.total_items}`;

  document.getElementById("current_page").innerText = meta.current_page;
  if (meta.next_page == null) {
    document.getElementById("next1").hidden = true;
  } else {
    document.getElementById("next1").hidden = false;
  }
  if (meta.prev_page == null) {
    document.getElementById("prev1").hidden = true;
  } else {
    document.getElementById("prev1").hidden = false;
  }
}

function handleMeta2(meta) {
  document.getElementById(
    "tableMeta2"
  ).innerText = `Showing ${meta.page_items} out of ${meta.total_items}`;

  document.getElementById("current_page2").innerText = meta.current_page;
  if (meta.next_page == null) {
    document.getElementById("next2").hidden = true;
  } else {
    document.getElementById("next2").hidden = false;
  }
  if (meta.prev_page == null) {
    document.getElementById("prev2").hidden = true;
  } else {
    document.getElementById("prev2").hidden = false;
  }
}

function next_btn() {
  usersPage++;
  getPagedUsersData();
}

function prev_btn() {
  if (usersPage > 1) {
    usersPage--;
    getPagedUsersData();
  }
}

function next_btn2() {
  banksPage++;
  getPagedBanksData();
}

function prev_btn2() {
  if (banksPage > 1) {
    banksPage--;
    getPagedBanksData();
  }
}
