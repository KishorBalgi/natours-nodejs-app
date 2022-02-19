const Review = require("../models/reviewModel");
const catchAsync = require("../util/catchAsync");
const AppError = require("../util/appError");
const factory = require("./handlerFactory");

exports.getReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({ tour: req.params.tourId });

  res.status(200).json({
    status: "success",
    reviews,
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  const review = await Review.create({
    review: req.body.review,
    rating: req.body.rating,
    user: req.user._id,
    tour: req.params.tourId,
  });
  if (!review) {
    return next(AppError("Could not create a review", 401));
  }
  res.status(201).json({
    status: "success",
    data: review,
  });
});
// Get a review:
exports.getReview = catchAsync(async (req, res, next) => {
  const review = await Review.find({
    _id: req.params.revId,
    tour: req.params.tourId,
  });
  res.status(200).json({
    status: "success",
    review,
  });
});
// Delete a review:
exports.deleteReview = factory.deleteOne(Review);
