import "@babel/polyfill";
import { login, logout, signup } from "./auth";
import { updateMe, changePassword } from "./update";
// DOM elements:
const loginForm = document.querySelector(".form-login");
const signupForm = document.querySelector(".form-signup");
const logoutBtn = document.querySelector(".nav__el--logout");
const updateForm = document.querySelector(".form-user-data");
const passChangeForm = document.querySelector(".form-user-settings");
// Login:
if (loginForm)
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    login(email, password);
  });
// Signup:
if (signupForm)
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("passwordConfirm").value;
    signup(name, email, password, passwordConfirm);
  });
// Logot:
if (logoutBtn) {
  logoutBtn.addEventListener("click", logout);
}
// Update Details:
if (updateForm) {
  updateForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append("name", document.getElementById("name").value);
    form.append("email", document.getElementById("email").value);
    if (document.getElementById("photo").files[0])
      form.append("photo", document.getElementById("photo").files[0]);
    updateMe(form);
  });
}
// Change Password:
if (passChangeForm) {
  passChangeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const password = document.getElementById("password-current").value;
    const newPassword = document.getElementById("password").value;
    const newPasswordConfirm =
      document.getElementById("password-confirm").value;
    changePassword(password, newPassword, newPasswordConfirm);
  });
}
