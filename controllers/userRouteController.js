const catchAsync = require("../util/catchAsync");
const AppError = require("../util/appError");
const User = require("../models/userModel");
const Tour = require("../models/tourModel");
const Review = require("../models/reviewModel");
const Booking = require("../models/booking");
const authController = require("../controllers/authController");
const multer = require("multer");
const sharp = require("sharp");
// Multer:

// Store image in file:
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/img/users");
//   },
//   filename: (req, file, cb) => {
//     // user-id-timestamp.jpeg
//     const ext = file.mimetype.split("/")[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

// Store image in buffer:
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) cb(null, true);
  else cb(new AppError("Not an Image! Please upload only images.", 400), false);
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
exports.uploadUserPhoto = upload.single("photo");
// Resize images:
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});
// JWT:
const jwt = require("jsonwebtoken");
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXP,
  });
};
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => (newObj[el] = obj[el]));
  return newObj;
};
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    status: "success",
    data: users,
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1.Check for password entries:
  if (req.body.password || req.body.confirmPassword) {
    return next(new AppError("This route is not for password changes."));
  }
  // Filter out unwanted fields:
  const filteredObj = filterObj(req.body, "name", "email");
  if (req.file) filteredObj.photo = req.file.filename;

  // 2.Create changes:
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredObj, {
    new: true,
    runValidators: true,
  });
  if (!updatedUser) {
    return next(new AppError("User not found", 404));
  }

  const token = signToken(updatedUser._id);
  res.status(200).json({
    status: "success",
    token,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  // 1. Find user and check password:
  const user = await User.findById(req.user._id)
    .select("+password")
    .select("+active");
  if (!user || !(await user.checkPassword(req.body.password, user.password))) {
    return next(new AppError("Invalid user.", 404));
  }
  // 2.Delete user:
  await user.update({ active: false });
  res.status(204).json({
    status: "success",
    message: "user deleted successfully",
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined",
  });
};

exports.getUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined",
  });
};

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined",
  });
};

exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined",
  });
};
// Me:
exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError("User not found!", 404));
  }
  res.status(200).json({
    status: "success",
    data: user,
  });
});
// Get my bookings:
exports.getMyBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user._id });
  const tourIDs = bookings.map((b) => b.tour.id);
  const tours = await Tour.find({ _id: { $in: tourIDs } });
  res.status(200).render("overview", {
    title: "My Bookings",
    tours,
  });
});
// Get my reviews:
exports.getMyReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({ user: req.user._id });
  const tourIDs = reviews.map((r) => r.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render("reviews", {
    title: "My Reviews",
    tours,
    reviews,
  });
  // res.status(200).json({
  //   tours,
  //   reviews,
  // });
});
