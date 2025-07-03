const loginBtn = document.getElementById("login-btn");
const errorMessage = document.getElementById("error-message");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

function attemptLogin() {
  const account = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!account || !password) {
    errorMessage.textContent = "請填寫帳號與密碼";
    return;
  }

  errorMessage.textContent = "";
  loginBtn.disabled = true;
  loginBtn.textContent = "登入中...";

  fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account, password }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        errorMessage.textContent = data.error;
        loginBtn.disabled = false;
        loginBtn.textContent = "登入";
        return;
      }

      // 儲存登入資訊
      localStorage.setItem("loginIdentity", data.identity);
      localStorage.setItem("loginAccount", account);

      // 根據身分導向頁面
      switch (data.identity) {
        case "一般員工": //員工
          window.location.href = "ask.html";
          break;
        case "主管":
          window.location.href = "admin.html";
          break;
        case "後台管理員":
          window.location.href = "backend.html";
          break;
        default:
          errorMessage.textContent = "未知身分";
          loginBtn.disabled = false;
          loginBtn.textContent = "登入";
      }
    })
    .catch((err) => {
      console.error(err);
      errorMessage.textContent = "伺服器連線錯誤";
      loginBtn.disabled = false;
      loginBtn.textContent = "登入";
    });
}

loginBtn.addEventListener("click", attemptLogin);

[usernameInput, passwordInput].forEach((input) => {
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") attemptLogin();
  });
});

document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("loginIdentity");
  localStorage.removeItem("loginAccount");
  window.location.href = "index.html";
});