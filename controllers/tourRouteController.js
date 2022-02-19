// File read:
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// exports.checkID = (req, res, next, val) => {
//   if (val > 10) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID',
//     });
//   }
//   next();
// };
// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price',
//     });
//   }
//   console.log(req.body);
//   next();
// };
const Tour = require("../models/tourModel");
const APIFeatures = require("../util/apiFeatures");
const AppError = require("../util/appError");
const catchAsync = require("../util/catchAsync");
const factory = require("./handlerFactory");
const multer = require("multer");
const sharp = require("sharp");
// Multer:

// Store image in buffer:
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) cb(null, true);
  else cb(new AppError("Not an Image! Please upload only images.", 400), false);
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
exports.uploadTourImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);
// Resize images:
exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // Cover Images:
  if (req.files.imageCover) {
    const imageCoverFileName = `tour-${req.params.id}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat("jpeg")
      .jpeg({ quality: 100 })
      .toFile(`public/img/tours/${imageCoverFileName}`);
    req.body.imageCover = imageCoverFileName;
  }
  // Images:
  if (req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (i, n) => {
        const imageName = `tour-${req.params.id}-${n + 1}.jpeg`;
        await sharp(i.buffer)
          .resize(2000, 1333)
          .toFormat("jpeg")
          .jpeg({ quality: 100 })
          .toFile(`public/img/tours/${imageName}`);
        req.body.images.push(imageName);
      })
    );
  }

  next();
});
exports.aliasTopTours = (req, res, next) => {
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,ratingsAverage,difficulty,price,summary";
  req.query.limit = "5";
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  // // 1A.Filtering:
  // const queryObj = { ...req.query };
  // const excludedFields = ['page', 'sort', 'limit', 'fields'];
  // excludedFields.forEach((f) => delete queryObj[f]);

  // // 1B.Advanced Filtering:
  // let queryStr = JSON.stringify(queryObj);
  // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
  // // Create a query:
  // let query = Tour.find(JSON.parse(queryStr));

  // // 2.Sorting:
  // if (req.query.sort) {
  //   const sortBy = req.query.sort.split(',').join(' ');
  //   query = query.sort(sortBy);
  // } else {
  //   query = query.sort('-createdAt');
  // }

  // // 3.Field Limiting:
  // if (req.query.fields) {
  //   const fields = req.query.fields.split(',').join(' ');
  //   query = query.select(fields);
  // } else {
  //   query = query.select('-__v');
  // }

  // // 4.Pagination:
  // const page = req.query.page * 1 || 1;
  // const limit = req.query.limit * 1 || 100;
  // const skip = (page - 1) * limit;
  // query = query.skip(skip).limit(limit);
  // if (req.query.page) {
  //   const numTours = await Tour.countDocuments();
  //   if (skip >= numTours) throw new Error('This page does not exist');
  // }

  //Execute the query:
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .fieldLimiting()
    .pagination();
  const tours = await features.query;
  // const tours = await features.query.explain();

  // Send Response:
  res.status(200).json({
    status: "success",
    reqAt: req.reqTime,
    results: tours.length,
    data: { tours },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id).populate("reviews");
  if (!tour) {
    return next(
      new AppError(`Could not find the tour with the id:${req.params.id}`, 404)
    );
  }
  res.status(200).json({
    status: "success",
    data: {
      tour,
    },
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      tour: newTour,
    },
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: "success",
    data: {
      tour,
    },
  });
});

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);
//   if (!tour) {
//     return next(AppError("No tour with this ID", 404));
//   }
//   res.status(204).json({
//     status: "success",
//     data: null,
//   });
// });
// Delete a Tour:
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: "$difficulty",
        numTours: { $sum: 1 },
        numRating: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    { $sort: { avgPrice: 1 } },
    // { $match: { _id: { $ne: 'difficult' } } },
  ]);
  res.status(200).json({
    status: "success",
    data: stats,
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTourStarts: { $sum: 1 },
        tours: { $push: "$name" },
      },
    },
    {
      addFields: {
        month: "$_id",
      },
    },
    {
      project: {
        _id: 0,
      },
    },
    {
      $sort: { munTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);
  res.status(200).json({
    status: "success",
    data: { plan },
  });
});
// Get tours within:
exports.getToursWithin = catchAsync(async (req, res, next) => {
  // /tours-within/:distance/center/:latlang/unit/:unit
  const { distance, latlang, unit } = req.params;
  const [lat, lang] = latlang.split(",");

  if (!lat || !lang) {
    return next(new AppError("Please specify center in lat,lang format", 400));
  }
  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lang, lat], radius] } },
  });
  res.status(200).json({
    status: "success",
    results: tours.length,
    data: {
      tours,
    },
  });
});
// Tour Distances:
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlang, unit } = req.params;
  const [lat, lang] = latlang.split(",");
  if (!lat || !lang) {
    return next(new AppError("Please specify center in lat,lang format", 400));
  }
  const multiplier = unit === "mi" ? 0.000621371 : 0.001;
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lang * 1, lat * 1],
        },
        distanceField: "distance",
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: "success",
    data: distances,
  });
});
