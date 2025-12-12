const Movies = require("../../models/Movies");
const Shorts = require("../../models/Shorts");
const CustomAds = require("../../models/CustomAds");  
const Slider = require("../../models/Slider"); // Add Slider import
const deleteVideoFromTencent = require("../deleteVideoFromTencent");
const deleteAudioFromTencent = require("../deleteAudioFromTencent");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

exports.deleteMovie = async (req, res, next) => {
  const { id } = req.params;
  console.log("Deleting movie:", id);
  
  try {

    const movie = await Movies.findById(id);
    if (!movie) {
      return res.status(404).json({ 
        msg: "Movie not found", 
        status: false 
      });
    }
    
    const shortsPromises = movie.shorts.map(async (shortId) => {
      if (shortId === "Ads") return;

      // Try as Short first
      if (mongoose.Types.ObjectId.isValid(shortId)) {
        const short = await Shorts.findById(shortId);
        if (short) {
          // Delete video
          if (short.fileId) {
            await deleteVideoFromTencent(short.fileId);
          }
          // Delete all short audios
          if (Array.isArray(short.shortAudio)) {
            for (const audio of short.shortAudio) {
              if (audio.audioFileId) {
                await deleteAudioFromTencent(audio.audioFileId);
                console.log(`Deleted short audio: ${audio.audioFileId}`);
              }
            }
          }
          // Delete short doc
          await Shorts.findByIdAndDelete(shortId);

          // Remove short from movie.shorts array (in case manual cleanup)
          await Movies.updateOne(
            { _id: movie._id },
            { $pull: { shorts: shortId } }
          );
          return;
        }

        // If not found in Shorts, try as CustomAds
        const adDoc = await CustomAds.findById(shortId);
        if (adDoc) {
          // Delete associated video in Tencent if fileId present
          if (adDoc.customUrlFileId ) {
            await deleteVideoFromTencent(adDoc.customUrlFileId );
            console.log(`Deleted custom ad video: ${adDoc.customUrlFileId }`);
          }
          // Delete the custom ad itself
          await CustomAds.findByIdAndDelete(shortId);

          // Remove custom ad from movie.shorts array (cleanup)
          await Movies.updateOne(
            { _id: movie._id },
            { $pull: { shorts: shortId } }
          );
          return;
        }
      }
      // If not valid ObjectId or not found, ignore
    });

    await Promise.all(shortsPromises);

    if (movie.fileLocation) {
          const thumbnailPath = path.join(__dirname,"..","..", movie.fileLocation);
          // console.log("Thumbnail path:", thumbnailPath);
          console.log("Attempting to delete icon at path:", thumbnailPath);
          console.log("Thumbnail name:", movie.fileLocation);
    
          if (fs.existsSync(thumbnailPath)) {
            console.log("File exists, deleting...");
            fs.unlinkSync(thumbnailPath);
            console.log("Icon deleted successfully");
          } else {
            console.log("File does not exist at path:", thumbnailPath);
          }
    }

    if (movie.trailerUrl && movie.trailerUrlFileId){
      await deleteVideoFromTencent(movie.trailerUrlFileId);
      console.log("Trailer deleted successfully");
    }

    if (Array.isArray(movie.trailerAudio)) {
      for (const audio of movie.trailerAudio) {
      if (audio.audioUrl && audio.audioFileId) {
      await deleteAudioFromTencent(audio.audioFileId);
      console.log(`Deleted audio: ${audio.audioName}`);
    }
  }
}

    const sliderDeleteResult = await Slider.deleteMany({ linkedMovie: id });
    console.log(`Deleted ${sliderDeleteResult.deletedCount} related sliders`);
    
    await Movies.findByIdAndDelete(id);

    return res.status(200).json({ 
      msg: "Movie and all related data deleted successfully",
      deletedSliders: sliderDeleteResult.deletedCount
    });

  } catch (error) {
    console.error("Error in deleteMovies:", error);
    return res.status(500).json({ 
      msg: "Error deleting movie", 
      error: error.message 
    });
  }
};