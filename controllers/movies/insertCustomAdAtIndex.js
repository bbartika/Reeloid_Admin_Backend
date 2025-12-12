const mongoose = require("mongoose");
const CustomAds = require("../../models/CustomAds");
const Movies = require("../../models/Movies");
const { ObjectId } = mongoose.Types;

// POST body: { movie_id, ad_id, insert_index? }
exports.insertCustomAdAtIndex = async (req, res) => {
  try {
    const { movie_id, ad_id, insert_index } = req.body;

    // Validate ObjectId inputs
    if (!ObjectId.isValid(movie_id)) {
      return res.status(400).json({ msg: "Invalid movie ID" });
    }
    if (!ObjectId.isValid(ad_id)) {
      return res.status(400).json({ msg: "Invalid custom ad ID" });
    }

    // Check ad exists
    const ad = await CustomAds.findById(ad_id);
    if (!ad) {
      return res.status(404).json({ msg: "Custom ad not found" });
    }

    // Check movie exists
    const movie = await Movies.findById(movie_id);
    if (!movie) {
      return res.status(404).json({ msg: "Movie not found" });
    }

    // Use or initialize shorts array
    let shorts = Array.isArray(movie.shorts) ? [...movie.shorts] : [];
    
    // Handle insert_index
    let insertAt = null;
    if (insert_index === undefined || insert_index === null) {
      insertAt = null; // Will append
    } else {
      const parsedIndex = parseInt(insert_index, 10);
      if (isNaN(parsedIndex)) {
        return res.status(400).json({ msg: "`insert_index` must be an integer" });
      }
      if (parsedIndex < 0 || parsedIndex > shorts.length) {
        return res.status(400).json({ msg: "Index out of range" });
      }
      insertAt = parsedIndex;
    }

    let action;
    if (insertAt === null) {
      shorts.push(ad_id);
      action = `Appended custom ad at end (index ${shorts.length - 1})`;
    } else {
      shorts.splice(insertAt, 0, ad_id);
      action = `Inserted custom ad at index ${insertAt}`;
    }

    // Save new shorts array
    const result = await Movies.updateOne(
      { _id: movie_id },
      { $set: { shorts } }
    );
    if (result.modifiedCount === 0) {
      return res.status(500).json({ msg: "Failed to update shorts" });
    }

    return res.status(200).json({ message: action });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      msg: "Something went wrong",
      err: err.message || err
    });
  }
};
