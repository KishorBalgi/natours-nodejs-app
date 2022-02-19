const express = require("express");
const authController = require("../controllers/authController");
const Router = express.Router();
const tourController = require("../controllers/tourRouteController");
const reviewsController = require("../controllers/reviewsController");

Router.route("/top-5-cheap").get(
  tourController.aliasTopTours,
  tourController.getAllTours
);

Router.route("/tour-stats").get(tourController.getTourStats);
Router.route("/monthly-plan/:year").get(tourController.getMonthlyPlan);

Router.route("/")
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictedTo("admin", "lead-guide"),
    tourController.createTour
  );

Router.route("/:id")
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictedTo("admin", "lead-guide"),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictedTo("admin", "lead-guide"),
    tourController.deleteTour
  );
// Reviews:

Router.route("/:tourId/reviews").post(
  authController.protect,
  authController.restrictedTo("user"),
  reviewsController.createReview
);
// Reviews:
Router.route("/:tourId/reviews").get(reviewsController.getReviews);
Router.route("/:tourId/reviews/:revId").get(reviewsController.getReview);
Router.route("/:tourId/reviews/:id/delete").delete(
  authController.protect,
  authController.restrictedTo("user", "admin"),
  reviewsController.deleteReview
);
// Tours within a geo range:
Router.route("/tours-within/:distance/center/:latlang/unit/:unit").get(
  tourController.getToursWithin
);
// Tour Distance:
Router.route("/distances/:latlang/unit/:unit").get(tourController.getDistances);
module.exports = Router;
