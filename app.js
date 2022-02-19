const path = require("path");
const express = require("express");
const app = express();
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");
const compression = require("compression");
// Trust proxies:
app.enable("trust proxy");
// Error handlers:
const AppError = require("./util/appError");
const globalErrorHandler = require("./controllers/errorController");
// Compress responses:
app.use(compression());
// Pug template:
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
// Static files:
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, "public")));
// Middlewares:
app.use(helmet());
// CORS:
app.use(cors());
app.options("*", cors());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this id, retry after an hour.",
});
app.use("/api", limiter);

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection:
app.use(mongoSanitize());
// Data sanitization against XSS:
app.use(xss());
// HTTP Parameter Pollution:
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);

app.use((req, res, next) => {
  req.reqTime = new Date().toISOString();
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' *; font-src 'self' *; img-src 'self' *; script-src 'self' *; style-src 'self' *; frame-src 'self' *"
  );
  next();
});

// Routes:
const tourRouter = require("./routes/tourRouter");
const userRouter = require("./routes/userRouter");
const viewRouter = require("./routes/viewRoutes");
const bookingRoter = require("./routes/bookingRoutes");
app.use("/api/v1/tours/", tourRouter);
app.use("/api/v1/users/", userRouter);
app.use("/api/v1/bookings/", bookingRoter);

app.use("/", viewRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`));
});
app.use(globalErrorHandler);
module.exports = app;
