const Movies = require("../../models/Movies");
const Shorts = require("../../models/Shorts");
const today = new Date();

const mongoose = require("mongoose");

exports.getShortsInfo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        msg: "Movie ID is required and must be valid",
      });
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

    //onst shortsPromises = movie.shorts.map(async (shortId) => {
    //   if (shortId === "Ads") return; // Skip if it's an ad

    const movie = await Movies.findById(id).select("shorts").lean();

    if (!movie) {
      return res.status(404).json({
        success: false,
        msg: "Movie not found",
      });
    }

    if (!movie.shorts || !Array.isArray(movie.shorts)) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const validShorts = movie.shorts.filter((shortId) => shortId !== "Ads");

    const shortsData = await Shorts.find({
      _id: { $in: validShorts },
    })
      .select("name views")
      .lean();

    const formattedData = shortsData.map((short, index) => ({
      name: short.name || `Episode ${index + 1}`,
      Views: short.views || 0,
    }));

    return res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error in getShortsInfo:", error);
    return res.status(500).json({
      success: false,
      msg: "Error fetching shorts info",
      error: error.message,
    });
  }
};

//This API is used to get all the shorts informatio(short name along with its views)
