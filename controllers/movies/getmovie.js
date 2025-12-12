const mongoose = require("mongoose");
const Movies = require("../../models/Movies");
const Shorts = require("../../models/Shorts");
const CustomAds = require("../../models/CustomAds");

exports.getmovie = async (req, res, next) => {
  const { id } = req.params;
  try {
    const response = await Movies.findById(id)
      .populate([
        { path: "layouts", select: "name _id" },
        { path: "genre", select: "name _id" },
        { path: "language", select: "name _id" },
      ])
      .lean();

    if (!response) {
      return res.status(404).json({ msg: "Movie not found" });
    }

    // Safely coerce shorts to array
    const shortsArray = Array.isArray(response.shorts) ? response.shorts : [];

    // For each entry in shorts: handle "Ads", then try Shorts, then CustomAds
    const shortsDetails = await Promise.all(shortsArray.map(async (entry) => {
      if (entry === "Ads") {
        return "Ads";
      }

      // Try as a Short
      if (mongoose.Types.ObjectId.isValid(entry)) {
        const shortDoc = await Shorts.findById(entry).lean();
        if (shortDoc) {
          // Optionally, you can do further transformation here if needed.
          return {
            _id: String(shortDoc._id),
            ...shortDoc,
          };
        }
        // Try as a Custom Ad next
        const adDoc = await CustomAds.findById(entry).lean();
        if (adDoc) {
          return {
            _id: String(adDoc._id),
            name: adDoc.name,
            adsUrlFileId: adDoc.customUrlFileId , // adjust naming if needed
            type: adDoc.type,
            customUrl: adDoc.customUrl,
            visible: adDoc.visible,
          };
        }
      }

      // If neither found, return null
      return null;
    }));

    // Assign fully resolved shorts
    response.shorts = shortsDetails;

    return res.status(200).json({ movieData: response });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "something went wrong", err: err?.message || err });
  }
};