const catchAsync = require("../util/catchAsync");
const AppError = require("../util/appError");
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const tour = await Model.findByIdAndDelete(req.params.id);
    if (!tour) {
      return next(AppError("No document with this ID", 404));
    }
    res.status(204).json({
      status: "success",
      data: null,
    });
  });
