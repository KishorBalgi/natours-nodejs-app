import axios from "axios";
import { showAlert } from "./alert";
export const updateMe = async (form) => {
  try {
    const res = await axios({
      method: "PATCH",
      url: "/api/v1/users/updateMe",
      data: form,
    });
    if ((res.data.status = "success")) {
      showAlert("success", "Updated successfully");
      window.setTimeout(() => {
        location.reload(true);
      }, 1500);
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};
// Password change:
export const changePassword = async (
  password,
  newPassword,
  newPasswordConfirm
) => {
  try {
    const res = await axios({
      method: "PATCH",
      url: "/api/v1/users/updatepassword",
      data: {
        password,
        newPassword,
        newPasswordConfirm,
      },
    });
    if ((res.data.status = "success")) {
      showAlert("success", "Password changed successfully");
      window.setTimeout(() => {
        location.reload(true);
        location.assign("/");
      }, 1500);
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};
