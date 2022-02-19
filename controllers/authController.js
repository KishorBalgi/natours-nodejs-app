const { promisify } = require("util");
const crypto = require("crypto");
const User = require("../models/userModel");
const catchAsync = require("../util/catchAsync");
const AppError = require("../util/appError");
const Email = require("../util/email");
// JWT:
const jwt = require("jsonwebtoken");
const { hostname } = require("os");
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXP,
  });
};
// SendToken:
const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  // Cookie:

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXP * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);
  res.status(statusCode).json({
    status: "success",
    token,
    data: { user: user },
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.password,
  });
  // Send email:
  const url = `${req.protocol}://${req.get("host")}/me`;
  await new Email(newUser, url).sendWelcome();
  // Token:
  sendToken(newUser, 200, res);
});

// Login:
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //   Check whether email and password exists:
  if (!email || !password) {
    return next(new AppError("Invalid Credentials!", 400));
  }
  //   Check whether user exists and verify password:
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.checkPassword(password, user.password))) {
    return next(new AppError("Invalid E-mail or Password", 401));
  }
  //   Generate token:
  sendToken(user, 200, res);
});
// Logout:
exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // Check whether a token exists:
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError("You are not logged in. Please login to access."));
  }
  // Validate the token:
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_KEY
  );
  // Check if the user still exists:
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError("The user belonging to this token no longer exists.", 401)
    );
  }
  // Check if the user changed the password after the token was issued:
  if (freshUser.changedPasswordComp(decoded.iat)) {
    return next(
      new AppError("User password changed, please login again.", 401)
    );
  }
  req.user = freshUser;
  res.locals.user = freshUser;
  next();
});

exports.restrictedTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You donot have permissions to perform this action.", 403)
      );
    }
    next();
  };
};
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Find user;
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError(`User not found with the email:${req.body.email}`, 404)
    );
  }
  // create reset token:
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // Send mail:
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetpassword/${resetToken}`;
  try {
    // Send email:
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: "success",
      message: "Reset token sent to user email.",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError(`Couldnt send email ${err}`), 500);
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1.Get the user with the token:
  const hashedToken = crypto
    .createHash("SHA256")
    .update(req.params.token)
    .digest("hex");
  // 2.Check if the token has not expired:

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError("Invalid Token!", 404));
  }

  // 3.Update password changed at:
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 4.login the user:
  sendToken(user, 201, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { password, newPassword, newPasswordConfirm } = req.body;
  if (!password || !newPassword || !newPasswordConfirm) {
    return next(new AppError("Invalid Credentials!", 404));
  }
  // 1.Get the user from db:

  const user = await User.findById(req.user.id).select("+password");

  // 2.Check whether the user password is correct:
  if (!user || !(await user.checkPassword(password, user.password))) {
    return next(new AppError("Invalid e-mail or password.", 404));
  }
  // 3.Update the new password:
  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  await user.save();

  // 4.Login:
  sendToken(user, 201, res);
});
// Is loged in:
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      // Validate the token:
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET_KEY
      );
      // Check if the user still exists:
      const freshUser = await User.findById(decoded.id);
      if (!freshUser) {
        return next();
      }
      // Check if the user changed the password after the token was issued:
      if (freshUser.changedPasswordComp(decoded.iat)) {
        return next();
      }
      res.locals.user = freshUser;
      return next();
    }
  } catch (err) {
    return next();
  }
  next();
};
