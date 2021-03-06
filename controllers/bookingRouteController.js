// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const catchAsync = require("../util/catchAsync");
const AppError = require("../util/appError");
const Tour = require("../models/tourModel");
const Booking = require("../models/booking");
// Book tour:
exports.bookTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourID);
  if (!tour) {
    return next(AppError("Invalid tour ID", 404));
  }
  const data = await Booking.create({
    tour: req.params.tourID,
    user: req.user._id,
    price: tour.price,
  });
  res.status(200).render("booked", { title: "Booking successful", tour });
});

// Stripe
// exports.getCheckoutSession = catchAsync(async (req, res, next) => {
//   // 1. Get the currently booked tour:
//   const tour = await Tour.findById(req.params.tourID);
//   if (!tour) {
//     return next(AppError("Invalid tour id", 404));
//   }
//   // 2. Create a checkout session:
//   const session = await stripe.checkout.sessions.create({
//     payment_method_types: ["card"],
//     success_url: `${req.protocol}://${req.get("host")}`,
//     cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`,
//     customer_email: req.user.email,
//     client_reference_id: req.params.tourID,
//     line_items: [
//       {
//         name: `${tour.name} Tour`,
//         description: tour.summary,
//         images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
//         amount: tour.price * 100,
//         currency: "usd",
//         quantity: 1,
//       },
//     ],
//   });
//   // 3.Create session as response:
//   res.status(200).json({
//     status: "success",
//     session,
//   });
// });
