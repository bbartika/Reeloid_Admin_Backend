const Movies = require("../../models/Movies");
const mongoose = require("mongoose");
const today = new Date();

exports.getNonTrendingMovies = async (req, res) => {
  const { type } = req.params;
  let matchCondition = {};

  const now = new Date();
  if (type === "Month") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    matchCondition.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
  } else if (type === "Year") {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    matchCondition.createdAt = { $gte: startOfYear, $lte: endOfYear };
  } else if (type === "HalfYear") {
    // Last 6 months from today
    const startOfHalfYear = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const endOfHalfYear = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    matchCondition.createdAt = { $gte: startOfHalfYear, $lte: endOfHalfYear };
  } else if (type === "Week") {
    // Last 7 days including today
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 6);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(now);
    endOfWeek.setHours(23, 59, 59, 999);
    matchCondition.createdAt = { $gte: startOfWeek, $lte: endOfWeek };
  } else if (type === "Day") {
    // Today only
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    matchCondition.createdAt = { $gte: startOfDay, $lte: endOfDay };
  } else if (type !== "All") {
    return res.status(400).json({ message: "Invalid type parameter" });
  }
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error("Database connection not established");
    }

    await Movies.updateMany(
      { licenseExpiry: { $gte: today.toISOString() }, visible: { $ne: false } },
      { $set: { visible: true } }
    );

    // Set visible to false if licenseExpiry < today AND visible is not already false
    await Movies.updateMany(
      { licenseExpiry: { $lt: today.toISOString() }, visible: { $ne: false } },
      { $set: { visible: false } }
    );

    const nonTrendingMovies = await Movies.find(matchCondition)
      .select("name views visible")
      .sort({ views: 1 }) // 1 for ascending order, -1 for descending
      .limit(10)
      .lean();

    // Format the response to match the desired structure
    const formattedMovies = nonTrendingMovies.map((movie) => ({
      name: movie.name,
      views: movie.views,
    }));

    return res.status(200).json({
      success: true,
      data: formattedMovies,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error fetching analytics data",
      message: error.message,
    });
  }
};
