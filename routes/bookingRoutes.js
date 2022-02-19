const express = require("express");
const authController = require("../controllers/authController");
const bookingController = require("../controllers/bookingRouteController");
const Router = express.Router();

// Router.route("/checkout-session/:tourID").get(
//   authController.protect,
//   bookingController.getCheckoutSession
// );
Router.route("/booktour/:tourID").get(
  authController.protect,
  bookingController.bookTour
);
module.exports = Router;
