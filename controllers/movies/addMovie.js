const { dirname } = require("path");
const Shorts = require("../../models/Shorts");
const Genre = require("../../models/genre");

const fs = require("fs");
const path = require("path");
const { time } = require("console");
const Movies = require("../../models/Movies");
const Layout = require("../../models/Layout");
const Language = require("../../models/language");
const uploadVideoToTencent = require("./../videoUploader");

// Reset time to midnight for accurate date comparison
const {
  addTaskToMovieUploadQueue,
} = require("../../queue/TaskQueue/Movies/addTAskToMovieUploadQueue");
const {
  addTaskToAudioUploadQueue,
} = require("../../queue/TaskQueue/Audios/addTaskToAudioUploadQueue");

const {
  addTaskToShortAudioUploadQueue,
} = require("../../queue/TaskQueue/Audios/addTaskToShortAudioUploadQueue");

exports.addMovie = async (req, res) => {
  const {
    title,
    layouts,
    freeVideos,
    visible,
    genres,
    trailerUrl,

    languages,
    trailerAudioLanguages,
    licenseExpiryDate,
    screenType,
    eachShortsPoint,
  } = req.body;
  console.log(req.files, "....");
  console.log(req.body, "....");

  if (!req?.files?.thumbnail) {
    return res.status(400).json({ msg: "please upload thumbnail" });
  }

  if (!title) {
    return res.status(400).json({ msg: "please provide title" });
  }

  if (layouts.length == 0 || !JSON.parse(layouts)) {
    return res.status(400).json({ msg: "please select layout" });
  }
  if (genres.length == 0 || !JSON.parse(genres)) {
    return res.status(400).json({ msg: "please provide genre" });
  }

  if (languages.length == 0 || !JSON.parse(languages)) {
    return res.status(400).json({ msg: "please provide content language" });
  }

  if (!req?.files?.trailerVideo && !req.body.trailerUrl) {
    return res
      .status(400)
      .json({ msg: "please provide trailerUrl or trailer video" });
  }

  // if (!req?.files?.trailerAudio && !req.body.trailerUrl) {
  //   return res.status(400).json({ msg: "please provide trailer audio" });
  // }

  const thumbNailName = req?.files?.thumbnail[0]?.filename;
  const parsedLayout = JSON.parse(layouts);

  const parsedGenre = JSON.parse(genres);

  const parsedLanguage = JSON.parse(languages);
  try {
    let trailerUrlTencent = undefined;
    if (req.files?.trailerVideo && req.files.trailerVideo.length > 0) {
      let trailerPath = req?.files?.trailerVideo[0]?.path || "";
      let trailerBuffer = fs.readFileSync(trailerPath) || "";
      //we need to handle if admin uses direct upload link then it will convert the file and save it to tencent so that we could maintaining same settings like video
      trailerUrlTencent = await uploadVideoToTencent(trailerBuffer);

      fs.unlink(trailerPath, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        } else {
          console.log("trailer video deleted successfully");
        }
      });
    }

    // let trailerAudioUploadResult;
    // const trailerAudioPath = req?.files?.trailerAudio[0]?.path || "";
    // const trailerAudioBuffer = fs.readFileSync(trailerAudioPath);

    //    trailerAudioUploadResult = await uploadAudioToTencent(trailerAudioBuffer);

    //   // Log or handle the upload result (URLs, fileId, etc)
    //   console.log(
    //     "Tencent audio uploaded & transcoded:",
    //     trailerAudioUploadResult
    //   );

    //   // Step 4: Optionally delete the local audio file after upload
    //   fs.unlink(trailerAudioPath, (err) => {
    //     if (err) console.error("Error deleting file:", err);
    //     else console.log("Trailer audio deleted successfully");
    //   });

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate date comparison
    const expiry = new Date(licenseExpiryDate);
    expiry.setHours(0, 0, 0, 0); // Reset time to midnight for accurate date comparison

    const visibleBool = visible === true || visible === "true";

    const movie = await Movies.create({
      status: req?.files?.shorts?.length > 0 ? "uploading" : "finished",
      name: title,
      fileLocation: `uploads/thumbnail/${thumbNailName}`,
      genre: parsedGenre,
      language: parsedLanguage,
      visible: expiry < today ? false : visibleBool,
      layouts: parsedLayout,
      freeVideos: freeVideos,
      trailerName: req?.files?.trailerVideo[0]?.filename,
      trailerUrl: trailerUrl || trailerUrlTencent?.multipleQualityUrls[0]?.Url,

      trailerUrlFileId: trailerUrlTencent?.fileId,

      parts: req?.files?.shorts?.length || 0,
      low: trailerUrlTencent?.multipleQualityUrls[1]?.Url,
      medium: trailerUrlTencent?.multipleQualityUrls[2]?.Url,
      high: trailerUrlTencent?.multipleQualityUrls[3]?.Url,

      licenseExpiry: licenseExpiryDate,
      screenType: screenType,
    });

    if (movie) {
      const pendingPromises = parsedLayout.map(async (current) => {
        const layoutResponse = await Layout.findById(current);
        if (layoutResponse) {
          layoutResponse.linkedMovies.push(movie._id);
          await layoutResponse.save();
        }
      });
      await Promise.all(pendingPromises);
    }
    if (movie && Array.isArray(parsedGenre)) {
      await Promise.all(
        parsedGenre.map(async (genreId) => {
          await Genre.findByIdAndUpdate(
            genreId,
            { $addToSet: { linkedMovies: movie._id } },
            { new: true }
          );
        })
      );
    }

    if (movie && Array.isArray(parsedLanguage)) {
      await Promise.all(
        parsedLanguage.map(async (languageId) => {
          await Language.findByIdAndUpdate(
            languageId,
            { $addToSet: { linkedMovies: movie._id } }, // add movie id if not already present
            { new: true }
          );
        })
      );
    }
    
    console.log(movie);

    const trailerAudioLanguages = JSON.parse(
      req.body.trailerAudioLanguages || "[]"
    );

    if (req?.files?.trailerAudios?.length > 0) {
      // Define counter outside
      // const maxPriority = req.files.trailerAudios.length;

      // req.files.trailerAudios.forEach((audio) => {
      //   console.log(audio, "audio....");

      //    addTaskToAudioUploadQueue(
      //     {
      //     audio,
      //     language: trailerAudioLanguages[i], // Use the counter
      //     movieId: movie._id  // Pass only ID to avoid serialization issues
      //   }),

      //   i++;  // Increment counter after using it
      // });

      for (let i = 0; i < req.files.trailerAudios.length; i++) {
        const audio = req.files.trailerAudios[i];
        const langObj = trailerAudioLanguages[i] || {}; // Safeguard if arrays are mismatched

        await addTaskToAudioUploadQueue({
          audio,
          language: langObj.language, // e.g., "English"
          visible: langObj.visible, // e.g., true/false
          movieId: movie._id,
          index: i,
          totalAudios: req.files.trailerAudios.length, // Total audios for this movie
        });
      }
    }

    // if (req?.files?.shorts?.length > 0) {
    //     req.files.shorts.forEach((short) => {
    //       console.log(short, "short....");
    //       addTaskToMovieUploadQueue({
    //         short, // Pass one short at a time
    //         parsedLanguage,
    //         parsedGenre,
    //         title,
    //         movieId: movie._id, // Pass only ID to avoid serialization issues
    //         deductionPoints: eachShortsPoint,
    //       });

    //     });
    //   }

    if (req?.files?.shorts?.length > 0) {
      for (let i = 0; i < req.files.shorts.length; i++) {
        const short = req.files.shorts[i];
        console.log(short, "short....");

        await addTaskToMovieUploadQueue({
          short,
          parsedLanguage,
          parsedGenre,
          title,
          movieId: movie._id,
          deductionPoints: eachShortsPoint,
          index: i,
          totalShorts: req.files.shorts.length,
        });
        //Tell me how to get id of short after it is created in the queue
        // I will use this id to save shorts data in the movie
        //I will use this id to save audios of shorts in the array of objects
        // const shortId = await movieUploadByQueue({
        //   short,
        // });

        console.log(short, "shorts....");
      }
      let updatedMovie;
      for (let tries = 0; tries < 60; tries++) {
        updatedMovie = await Movies.findById(movie._id);
        const allShortsExist = await Promise.all(
          (updatedMovie.shorts || []).map((id) => Shorts.exists({ _id: id }))
        );
        console.log("allShortsExist", allShortsExist);
        if (
          updatedMovie.shorts.length === req.files.shorts.length &&
          allShortsExist.every(Boolean)
        )
          break;
        await new Promise((res) => setTimeout(res, 1000)); // use 1s for faster feedback
      }
      console.log("updatedMovie.shorts", updatedMovie.shorts);

      for (let i = 0; i < updatedMovie.shorts.length; i++) {
        const shortId = updatedMovie.shorts[i]; // Get the shortId from the movie shorts array
        if (typeof shortId === "string") continue;

        console.log("short id in movie", shortId);

        const shortsAudios = req.files[`shortAudio_${i}`] || [];
        const shortsAudioLangs = JSON.parse(
          req.body[`shortsAudioLanguages_${i}`] || "[]"
        );

        for (let j = 0; j < shortsAudios.length; j++) {
          const audio = shortsAudios[j];
          const langObj = shortsAudioLangs[j] || {};

          //I want to get shortId from movie

          // Upload/process audio with language
          await addTaskToShortAudioUploadQueue({
            audio,
            language: langObj.language, // e.g., "English"
            visible: langObj.visible, // e.g., true/false
            shortId: shortId,
            index: j,
            totalAudios: shortsAudios.length, // Total audios for this movie
          });
        }
      }
    }

    return res
      .status(200)
      .json({ msg: "file saved successfully", movieData: movie });
  } catch (err) {
    console.log(err);
    const newThumbnailPAth = req?.files?.thumbnail[0].path;
    fs.unlink(newThumbnailPAth, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      } else {
        console.log("File deleted successfully");
      }
    });
    return res.status(400).json({ msg: "something went wrong", err: err });
  }
};
