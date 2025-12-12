const Movies = require("../../models/Movies");
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, "0");
const dd = String(today.getDate()).padStart(2, "0");
const todayStr = `${yyyy}-${mm}-${dd}`;
console.log(todayStr, "today date in getAllMovies");

exports.getAllMoviesInAnalytics = async (req, res, next) => {
  const { start, limit, searched = "" } = req.query;
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

  console.log(start, limit, searched);

  let filter = { ...matchCondition };
  try {
    if (searched && searched.trim() !== "") {
      filter = {
        $and: [
          matchCondition,
          {
            $or: [{ name: { $regex: searched, $options: "i" } }],
          },
        ],
      };
    }
    console.log(today.toISOString(), "today date in getAllMovies");

    const totalMoviesCount = await Movies.countDocuments(filter);
    await Movies.updateMany(
      { licenseExpiry: { $gte: todayStr }, visible: { $ne: false } },
      { $set: { visible: true } }
    );

    // Set visible to false if licenseExpiry < today AND visible is not already false
    await Movies.updateMany(
      { licenseExpiry: { $lt: todayStr }, visible: { $ne: false } },
      { $set: { visible: false } }
    );
    const allMovies = await Movies.find(filter)
      .sort({ createdAt: -1 })
      .populate([
        {
          path: "layouts",
          select: "name ", // Only include 'name' and 'type' fields
        },
        {
          path: "genre",
          select: "name ", // Only include 'name' and 'type' fields
        },
      ])
      .skip(limit * start)
      .limit(limit);
    // console.log(allMovies[0].layouts)
    if (!allMovies) {
      return res.status(200).json({ allMovies: [] });
    }
    return res.status(200).json({
      allMovies,
      start,
      limit,
      totalData: totalMoviesCount,
      totalPages: Math.ceil(totalMoviesCount / limit),
    });
  } catch (error) {
    return res.status(400).json({ err: error });
  }
};
