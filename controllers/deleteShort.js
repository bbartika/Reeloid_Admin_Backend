const mongoose = require("mongoose");
const Movies = require("../models/Movies");
const Shorts = require("../models/Shorts");
const fs = require("fs");
const path = require("path");
const deleteVideoFromTencent = require("./deleteVideoFromTencent");
exports.deleteShort = async (req, res, next) => {
  console.log(req.params.id);
  const { id } = req.params;
  try {
    const short = await Shorts.findById(id);

    if (short) {
      // 1. Delete from Tencent Cloud
      if (short.fileId) {
        await deleteVideoFromTencent(short.fileId);
      } else {
        console.log("fileId is missing for short:", short);
        return res.status(400).json({ error: "fileid is missing" });
      }

      // 2. Delete from Shorts collection
      await Shorts.findByIdAndDelete(id);
    }

    // const response = await Shorts.findByIdAndDelete(id);

    // if (!response) {
    //   return res
    //     .status(400)
    //     .json({ msg: "could  not find the file plz try after sometime" });
    // }
    // const deleteResponse = fs.unlinkSync(
    //   path.join(__dirname, "..", response.fileLocation)
    // );
    // if(response.fileId){
    //   console.log("fileId is missing for short:", response.fileId);
    //   return res.status(400).json({ error: "fileid is missing" });
    // }
    // const deleteResponse = await deleteVideoFromTencent(response.fileId);

    const objectId = new mongoose.Types.ObjectId(id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid short ID" });
    }

    const movie = await Movies.findOne({ shorts: objectId });
    if (!movie) {
      return res
        .status(404)
        .json({ msg: "Movie containing the short not found" });
    }

    
    await Movies.updateOne({ _id: movie._id }, { $pull: { shorts: objectId } });

    const updatedMovie = await Movies.findById(movie._id);

    // 5. Find all shorts in this movie excluding "Ads"
    const validShorts = (updatedMovie.shorts || []).filter(
      (id) => id.toString() !== "Ads"
    );
    updatedMovie.parts = validShorts.length;
    await updatedMovie.save();

    return res.status(200).json({ msg: "Short deleted Successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "something went wrong", err: err });
  }
};
