const Movies = require("../../models/Movies");
const Shorts = require("../../models/Shorts");
const Slider = require("../../models/Slider"); // Add Slider import
const deleteVideoFromTencent = require("../deleteVideoFromTencent");
const deleteAudioFromTencent = require("../deleteAudioFromTencent");
const path = require("path");
const fs = require("fs");

exports.deleteMovie = async (req, res, next) => {
  const { id } = req.params;
  console.log("Deleting movie:", id);

  try {
    const movie = await Movies.findById(id);
    if (!movie) {
      return res.status(404).json({
        msg: "Movie not found",
        status: false,
      });
    }

    if (movie.trailerUrlFileId) {
      await deleteVideoFromTencent(movie.trailerUrlFileId);
    }
    if (movie.trailerAudio && movie.trailerAudio.length > 0) {
      for (const audio of movie.trailerAudio) {
        if (audio.audioFileId) {
          await deleteAudioFromTencent(audio.audioFileId);
        }
      }
    }

    const shortsPromises = movie.shorts.map(async (shortId) => {
      if (shortId === "Ads") return; // Skip if it's an ad

      try {
        const short = await Shorts.findById(shortId);
        if (short) {
          // Delete the main video file from Tencent
          if (short.fileId) {
            await deleteVideoFromTencent(short.fileId);
          }

          // Delete all audios for this short from Tencent
          if (Array.isArray(short.audios)) {
            for (const audio of short.audios) {
              if (audio.audioFileId) {
                await deleteAudioFromTencent(audio.audioFileId);
                console.log(`Deleted short audio: ${audio.audioFileId}`);
              }
            }
          }

          await Shorts.findByIdAndDelete(shortId);

          await Movies.updateOne(
            { _id: movie._id },
            { $pull: { shorts: shortId } }
          );
        }
      } catch (error) {
        console.error(`Error deleting short ${shortId}:`, error);
        return res.status(500).json({
          msg: "Error deleting some shorts",
        });
        //failedShorts.push(shortId);
      }
    });

    await Promise.all(shortsPromises);

    if (movie.fileLocation) {
      const thumbnailPath = path.join(
        __dirname,
        "..",
        "..",
        movie.fileLocation
      );
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
    await Language.updateMany(
      { linkedMovies: movie._id },
      { $pull: { linkedMovies: movie._id } }
    );

    // 2. Remove from Genre
    await Genre.updateMany(
      { linkedMovies: movie._id },
      { $pull: { linkedMovies: movie._id } }
    );

    // 3. Remove from Layout
    await Layout.updateMany(
      { linkedMovies: movie._id },
      { $pull: { linkedMovies: movie._id } }
    );

    const sliderDeleteResult = await Slider.deleteMany({ linkedMovie: id });
    console.log(`Deleted ${sliderDeleteResult.deletedCount} related sliders`);

    await Movies.findByIdAndDelete(id);

    return res.status(200).json({
      msg: "Movie and all related data deleted successfully",
      deletedSliders: sliderDeleteResult.deletedCount,
    });
  } catch (error) {
    console.error("Error in deleteMovies:", error);
    return res.status(500).json({
      msg: "Error deleting movie",
      error: error.message,
    });
  }
};
