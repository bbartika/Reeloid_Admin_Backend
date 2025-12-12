const Movies = require("../../models/Movies");
const today = new Date();

const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, "0");
const dd = String(today.getDate()).padStart(2, "0");
const todayStr = `${yyyy}-${mm}-${dd}`;

exports.getAllPublishedMovies = async (req, res) => {
  try {
    // Find all movies where visible is true
    

    // Set visible to false if licenseExpiry < today AND visible is not already false
    await Movies.updateMany(
      { licenseExpiry: { $gte: todayStr }, visible: { $ne: false } },
      { $set: { visible: true } }
    );

    // Set visible to false if licenseExpiry < today AND visible is not already false
    await Movies.updateMany(
      { licenseExpiry: { $lt: todayStr }, visible: { $ne: false } },
      { $set: { visible: false } }
    );
    const movies = await Movies.find({ visible: true })
      .select("name _id") // Only select name and id fields
      .sort({ createdAt: -1 }); // Sort by newest first

    if (!movies || movies.length === 0) {
      return res.status(200).json({
        success: true,
        movies: [],
        message: "No published movies found",
      });
    }

    return res.status(200).json({
      success: true,
      movies: movies,
      message: "Published movies fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching published movies:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching published movies",
      error: error.message,
    });
  }
};
