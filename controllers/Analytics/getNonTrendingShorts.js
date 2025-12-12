const Shorts = require("../../models/Shorts");
const Movies = require("../../models/Movies");
const today = new Date();

exports.getNonTrendingShorts = async (req, res) => {
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
    // First get top 10 shorts by views
    const shorts = await Shorts.find({ visible: true, ...matchCondition })
      .select("name views fileLocation")
      .sort({ views: 1 })
      .limit(10)
      .lean();
    // console.log(shorts);
    await Movies.updateMany(
      { licenseExpiry: { $gte: today.toISOString() }, visible: { $ne: false } },
      { $set: { visible: true } }
    );

    // Set visible to false if licenseExpiry < today AND visible is not already false
    await Movies.updateMany(
      { licenseExpiry: { $lt: today.toISOString() }, visible: { $ne: false } },
      { $set: { visible: false } }
    );

    // Get all movies
    const allMovies = await Movies
      .find
      // Ensure movies are not expired
      ()
      .select("name shorts visible")
      .lean();
    // console.log(allMovies);

    const formattedShorts = shorts.map((short) => {
      // Add null check for short._id
      if (!short || !short._id) {
        return {
          shortsName: short?.name || "Unknown Short",
          movieName: "Unknown",
          views: short?.views || 0,
        };
      }

      // Find the movie that contains this short in its shorts array
      const movie = allMovies.find((movie) =>
        movie?.shorts?.some(
          (movieShort) =>
            movieShort &&
            movieShort._id &&
            movieShort._id.toString() === short._id.toString()
        )
      );
      // console.log("movie", movie);

      return {
        shortsName: short.name,
        movieName: movie ? movie.name : "Unknown",
        views: short.views,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedShorts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: "Error fetching trending shorts",
      error: error.message,
    });
  }
};
