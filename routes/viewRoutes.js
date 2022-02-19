const express = require("express");

const Router = express.Router();
const viewController = require("../controllers/viewController");
const authController = require("../controllers/authController");
const userController = require("../controllers/userRouteController");

// Pug Routes:

Router.route("/").get(authController.isLoggedIn, viewController.overview);

Router.route("/tour/:slug").get(authController.isLoggedIn, viewController.tour);

Router.route("/login").get(viewController.getLoginForm);

Router.route("/signup").get(viewController.getSignupForm);

Router.route("/me").get(authController.protect, viewController.getMe);

Router.route("/myBookings").get(
  authController.protect,
  userController.getMyBookings
);

Router.route("/myReviews").get(
  authController.protect,
  userController.getMyReviews
);
module.exports = Router;
