const mongoose = require("mongoose");

// Uncaught Exceptions:
process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log("UNCAUGHT EXCEPTION! Shutting down app...");

  process.exit(1);
});

const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const app = require("./app");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);
// Connecting our DB:
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((con) => {
    console.log("DB Connection succesful!");
  });

// Server:
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
// Unhandled Rejections:
process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("UNHANDLED REJECTION! Shutting down app...");
  server.close(() => {
    process.exit(1);
  });
});
// SIGTERM signal:
process.om("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully!");
  server.close(() => {
    console.log("Process terminated.");
  });
});
