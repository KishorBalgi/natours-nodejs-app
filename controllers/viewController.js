const Tour = require("../models/tourModel");
const User = require("../models/userModel");
const catchAsync = require("../util/catchAsync");
const AppError = require("../util/appError");
// const authController = require("./authController");

exports.overview = catchAsync(async (req, res) => {
  const tours = await Tour.find();

  res.status(200).render("overview", {
    title: "All tours",
    tours,
  });
});

exports.tour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    fields: "review rating user",
  });
  if (!tour) {
    return next(new AppError("There is no tour with that name", 404));
  }
  res.status(200).render("tour", {
    title: tour.name,
    tour: tour,
  });
});
// Login:
exports.getLoginForm = catchAsync(async (req, res, next) => {
  res.status(200).render("login", {
    title: "Login",
  });
});
// Signup:
exports.getSignupForm = catchAsync(async (req, res, next) => {
  res.status(200).render("signup", {
    title: "Signup",
  });
});
// ME:
exports.getMe = catchAsync(async (req, res, next) => {
  res.status(200).render("me", {
    title: `Account | ${req.user.name}`,
    user: req.user,
  });
});
