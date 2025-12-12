const Movies = require("../../models/Movies");
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const todayStr = `${yyyy}-${mm}-${dd}`;
console.log(todayStr, "today date in getAllMovies");


exports.getAllMovies = async (req, res, next) => {
  const { start, limit, searched = "" } = req.query;
  console.log(start, limit, searched);

  let filter = {};
  try {
    if (searched && searched.trim() !== "") {
      filter = {
        $or: [{ name: { $regex: searched, $options: "i" } }],
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
    const allMovies = await Movies.find(filter).sort({createdAt:-1})
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