const mongoose = require("mongoose");
const Movies = require("../../models/Movies");
const CustomAds = require("../../models/CustomAds");
const { ObjectId } = mongoose.Types;

exports.deleteCustomAdsFromMovie = async (req, res) => {
  try {
    const { movie_id, custom_id, index } = req.body;

    // Validate IDs
    if (!ObjectId.isValid(movie_id)) {
      return res.status(400).json({ msg: "Invalid movie ID" });
    }
    if (!ObjectId.isValid(custom_id)) {
      return res.status(400).json({ msg: "Invalid custom ad ID" });
    }
    if (typeof index !== 'number' || index < 0) {
      return res.status(400).json({ msg: "Invalid or missing index" });
    }

    // Check custom ad exists
    const customAd = await CustomAds.findById(custom_id);
    if (!customAd) {
      return res.status(404).json({ msg: "Custom ad not found" });
    }

    // Fetch the movie
    const movie = await Movies.findById(movie_id);
    if (!movie) {
      return res.status(404).json({ msg: "Movie not found" });
    }

    const shorts = Array.isArray(movie.shorts) ? [...movie.shorts] : [];
    if (index < 0 || index >= shorts.length) {
      return res.status(400).json({ msg: "Index out of range" });
    }

    if (shorts[index].toString() !== custom_id) {
      return res.status(400).json({ msg: "Custom ad ID not found at the given index" });
    }

    // Remove by index (set to null, then pull null)
    shorts[index] = null;
    await Movies.updateOne(
      { _id: movie_id },
      { $set: { shorts } }
    );

    await Movies.updateOne(
      { _id: movie_id },
      { $pull: { shorts: null } }
    );

    return res.status(200).json({ msg: `Custom ad removed from index ${index} in movie's shorts array` });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      msg: "Something went wrong",
      error: err.message || err
    });
  }
};
