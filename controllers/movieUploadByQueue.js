const { default: mongoose } = require("mongoose");
const Movies = require("../models/Movies");
const Shorts = require("../models/Shorts");
const uploadVideoToTencent = require("./videoUploader");
const fs = require("fs");
const path = require("path");

const tempTrailerShortStore = {};
exports.movieUploadByQueue = async (data) => {
  // async function SaveShortsData(movieId, shortsId) {
  //   // console.log(shortsId,"HJFSDJKAHVKJFGVSJKGFVDSBGVC")
  //   const response = await Movies.findByIdAndUpdate(
  //     movieId,
  //     {
  //       status:"finished",
  //       $push: {
  //         shorts: new mongoose.Types.ObjectId(shortsId),
  //       },
  //     }
  //   );

  //   // if (response) {
  //   //   const thumbnailPath = path.join(__dirname, '..', response.fileLocation);
  //   //   fs.unlink(thumbnailPath, (err) => {
  //   //     if (err) {
  //   //       console.error("Error deleting thumbnail:", err);
  //   //     } else {
  //   //       console.log("Thumbnail deleted successfully");
  //   //     }
  //   //   });
  //   // }
  // }
  try {
    const current = data.short;
    console.log(current, "current shorts");

    if (current.originalname === "Personalised_Ad.txt") {
      SaveShortsData(data.movieId, "Ads");
      return;
    }

    const currentShortsBuffer = fs.readFileSync(current.path);
    const videoData = await uploadVideoToTencent(currentShortsBuffer);

    console.log(
      "shorts ..........",
      videoData.multipleQualityUrls,
      "..............................................."
    );

    const short = await Shorts.create({
      name: current.filename,
      movieName: data.title,
      fileLocation: videoData.multipleQualityUrls[0].Url,

      fileId: videoData.fileId,

      visible: true,
      genre: data.parsedGenre,
      language: data.parsedLanguage,
      low: videoData.multipleQualityUrls[1].Url,
      medium: videoData.multipleQualityUrls[2].Url,
      high: videoData.multipleQualityUrls[3].Url,
      deductionPoints: data?.deductionPoints || 0,
    });
    console.log(short, "shorts....");
    //I want to get this short._id in the addMovie controller

    //delete the local file after uploading

    fs.unlink(current.path, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      } else {
        console.log("File deleted successfully");
      }
    });

    if (!tempTrailerShortStore[data.movieId]) {
      tempTrailerShortStore[data.movieId] = {
        array: [],
        count: 0,
        total: data.totalShorts,
      };
    }
    // const shortMeta = {
    //   id: short._id
    // };

    // Store at the correct index
    tempTrailerShortStore[data.movieId].array[data.index] = short._id;
    tempTrailerShortStore[data.movieId].count++;

    console.log("short Id", short._id);

    // When all uploads are done, update the DB
    if (
      tempTrailerShortStore[data.movieId].count ===
      tempTrailerShortStore[data.movieId].total
    ) {
      const movie = await Movies.findById(data.movieId).lean();
      const existingShorts = Array.isArray(movie.shorts) ? movie.shorts : [];
      const filteredShorts = existingShorts.filter(short => short !== "Ads");

      const combinedShorts = [...existingShorts, ...tempTrailerShortStore[data.movieId].array];
      const combinedFilteredShorts = [...filteredShorts, ...tempTrailerShortStore[data.movieId].array];



      await Movies.findByIdAndUpdate(
        data.movieId,
        {
          $set: {
            shorts: combinedShorts,
            status: "finished",
            parts: combinedFilteredShorts.length
            
          },
        },
        { new: true }
      );
      // Clean up
      delete tempTrailerShortStore[data.movieId];
      console.log("SHORT UPLOADED");

      // let shortName

      // await SaveShortsData(data.movieId, short._id);
    }
  } catch (error) {
    console.log(error, "error inside movieUploadByQueue Controllers");
  }
};