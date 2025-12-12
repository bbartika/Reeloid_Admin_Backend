const CustomAds = require("../../models/CustomAds");
const deleteVideoFromTencent = require("../deleteVideoFromTencent");
const Movies = require("../../models/Movies");
const { default: mongoose } = require("mongoose");

/**
 * DELETE Custom Ad by ID via req.query
 */
exports.deleteCustomAds = async (req, res) => {
  try {
    const { id } = req.query;

    // Validate ID
    if (!id) {
      return res.status(400).json({
        msg: "Ad ID is required in query parameters"
      });
    }
    const objectId = new mongoose.Types.ObjectId(id);
    const strId = id;

    const customAd = await CustomAds.findById(objectId);

    

    if (!customAd) {
      return res.status(404).json({
        msg: "Ad not found with the provided ID"
      });
    }
    if (customAd.customUrlFileId) {
      await deleteVideoFromTencent(customAd.customUrlFileId);
    }

    // Try to find and delete the ad
    const deletedAd = await CustomAds.findByIdAndDelete({ _id: objectId });

    if (!deletedAd) {
      return res.status(404).json({
        msg: "Ad not found with the provided ID"
      });
    }
    await Movies.updateMany(
      { shorts: { $in: [objectId, strId] } },
      { $pull: { shorts: { $in: [objectId, strId] } } }
    );

    return res.status(200).json({
      msg: "Custom ad deleted successfully",
      deletedAdId: deletedAd._id
    });
  } catch (error) {
    console.error("Error deleting custom ad:", error);
    return res.status(500).json({
      msg: "Something went wrong while deleting the ad",
      err: error.message || error
    });
  }
};