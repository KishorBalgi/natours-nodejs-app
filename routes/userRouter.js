const express = require("express");
const Router = express.Router();
const userController = require("../controllers/userRouteController");
const authController = require("../controllers/authController");

Router.route("/signup").post(authController.signup);
Router.route("/login").post(authController.login);
Router.route("/logout").get(authController.logout);

// Password:
Router.route("/forgotpassword").post(authController.forgotPassword);
Router.route("/resetpassword/:token").patch(authController.resetPassword);
Router.use(authController.protect);
Router.route("/updatepassword").patch(
  authController.restrictedTo("admin"),
  authController.updatePassword
);
// Update user:
Router.route("/updateMe").patch(
  authController.restrictedTo("admin"),
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
// Delete user:
Router.route("/deleteMe").delete(userController.deleteMe);
Router.route("/me").get(userController.getMe);
// Bookings:
Router.route("/myBookings").get(userController.getMyBookings);

Router.route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

Router.route("/:id")
  .get(userController.getUser)
  .patch(authController.restrictedTo("user"), userController.updateUser)
  .delete(
    authController.restrictedTo("user", "admin"),
    userController.deleteUser
  );

module.exports = Router;
