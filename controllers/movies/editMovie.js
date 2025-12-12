const Movies = require("../../models/Movies");
const path = require("path");
const fs = require("fs");
const Shorts = require("../../models/Shorts");
const Layout = require("../../models/Layout");
const Genre = require("../../models/genre");
const Language = require("../../models/language");
const Slider = require("../../models/Slider");
const uploadVideoToTencent = require("./../videoUploader");
const uploadAudioToTencent = require("./../audioUploader");

const deleteVideoFromTencent = require("../deleteVideoFromTencent");
const deleteAudioFromTencent = require("../deleteAudioFromTencent");
const { captureRejections } = require("stream");

const {
  addTaskToAudioUploadQueue,
} = require("../../queue/TaskQueue/Audios/addTaskToAudioUploadQueue");


const {
  addTaskToMovieUploadQueue,
} = require("../../queue/TaskQueue/Movies/addTAskToMovieUploadQueue");

const {
  addTaskToShortAudioUploadQueue,
} = require("../../queue/TaskQueue/Audios/addTaskToShortAudioUploadQueue");

exports.editMovie = async (req, res, next) => {
  const {
    id,
    title,
    layouts,
    freeVideos,
    visible,
    genres,
    languages,
    screenType,
    licenseExpiryDate,
  } = req.body;
  // console.log(req.body, ".visible.");

  // console.log(req.files, "....");


  if (genres.length == 0 || !JSON.parse(genres)) {
    return res.status(400).json({ msg: "please provide genre" });
  }


  if (layouts.length == 0 || !JSON.parse(layouts)) {
    return res.status(400).json({ msg: "please select layout" });
  }

  if (languages.length == 0 || !JSON.parse(languages)) {
    return res.status(400).json({ msg: "please provide content language" });
  }


  const parsedLanguage = JSON.parse(languages);

  // console.log(screenType, licenseExpiryDate);
  async function unlinkMovieHandler() {
    const allLayouts = await Movies.findById(id).select("layouts -_id");

    const pendingPromises = allLayouts?.layouts.map(async (current) => {
      const matched = JSON.parse(layouts)?.find((element) => {
        return element == current.toString();
      });

      if (!matched) {
        // console.log(current, "...>");
        const delinkMoviesFromLAyout = await Layout.findById(current);
        await delinkMoviesFromLAyout.linkedMovies.pull(id);
        await delinkMoviesFromLAyout.save();
      }
    });
    await Promise.all(pendingPromises);
  }

  const parsedLayout = JSON.parse(layouts); //i need to check if any id is already present then dont return it in parsed layout because it will come twice
  const parsedGenre = JSON.parse(genres);

  try {
    const shortsFolderLocation = path.join(
      __dirname,
      "..",
      "uploads",
      "shorts"
    );

    if (req.files.thumbnail) {
      const getMovies = await Movies.findById(id);
      if (!getMovies) {
        return res.status(400).json({ msg: "no data found" });
      }

      const movieId = getMovies._id;
      console.log(movieId, "movieId");

      const thumbnailPath = path.join(
        __dirname,
        "..",
        "..",
        getMovies.fileLocation
      );
      console.log(thumbnailPath, "....");

      const thumbNailName = req?.files?.thumbnail[0]?.filename;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      console.log(today); // Reset time to midnight for accurate date comparison
      const expiry = new Date(licenseExpiryDate);
      expiry.setHours(0, 0, 0, 0); // Reset time to midnight for accurate date comparison
      try {
        const visibleBool = visible === true || visible === "true";
        await unlinkMovieHandler();

        const existingMovieWithLanguage = await Movies.findById(movieId).select(
          "language"
        );
        const previousLanguages = (
          existingMovieWithLanguage.language || []
        ).map((id) => id.toString());

        const existingMovieWithLayouts = await Movies.findById(movieId).select(
          "layouts"
        );
        const previousLayouts = (existingMovieWithLayouts.layouts || []).map(
          (id) => id.toString()
        );

        const existingMovieGenre = await Movies.findById(movieId).select(
          "genre"
        );
        const previousGenres = (existingMovieGenre.genre || []).map((id) =>
          id.toString()
        );

        const result = await getMovies.updateOne({
          name: title,
          fileLocation: `uploads/thumbnail/${thumbNailName}`,
          genre: parsedGenre,
          visible: expiry < today ? false : visibleBool,
          layouts: parsedLayout,
          freeVideos: freeVideos,
          language: parsedLanguage,
          licenseExpiry: licenseExpiryDate,
          screenType: screenType,
        });
        console.log(getMovies, "getMovies");

        // console.log(result)

        const currentLayouts = parsedLayout.map((id) => id.toString());

        const layoutsToRemove = previousLayouts.filter(
          (id) => !currentLayouts.includes(id)
        );
        if (layoutsToRemove.length > 0) {
          await Layout.updateMany(
            { _id: { $in: layoutsToRemove } },
            { $pull: { linkedMovies: movieId } }
          );
        }
        if (parsedLayout.length > 0) {
          await Promise.all(
            parsedLayout.map((layoutId) => {
              return Layout.findByIdAndUpdate(
                layoutId,
                { $addToSet: { linkedMovies: movieId } }, // add movieId if not already present
                { new: true }
              );
            })
          );
        }

        const currentGenres = parsedGenre.map((id) => id.toString());

        const genresToRemove = previousGenres.filter(
          (id) => !currentGenres.includes(id)
        );
        if (genresToRemove.length > 0) {
          await Genre.updateMany(
            { _id: { $in: genresToRemove } },
            { $pull: { linkedMovies: movieId } }
          );
        }

        if (parsedGenre.length > 0) {
          await Promise.all(
            parsedGenre.map((genreId) => {
              return Genre.findByIdAndUpdate(
                genreId,
                { $addToSet: { linkedMovies: movieId } }, // add movieId if not already present
                { new: true }
              );
            })
          );
        }

        const currentLanguages = parsedLanguage.map((id) => id.toString());

        const languagesToRemove = previousLanguages.filter(
          (id) => !currentLanguages.includes(id)
        );

        if (languagesToRemove.length > 0) {
          await Language.updateMany(
            { _id: { $in: languagesToRemove } },
            { $pull: { linkedMovies: movieId } }
          );
        }

        if (parsedLanguage.length > 0) {
          await Promise.all(
            parsedLanguage.map((languageId) => {
              return Language.findByIdAndUpdate(
                languageId,
                { $addToSet: { linkedMovies: movieId } }, // add movieId if not already present
                { new: true }
              );
            })
          );

        }

        // const response = await Layout.find().select("_id");
        // console.log(response)
        const eachShortsPoint = 0;
        if (req?.files?.shorts?.length > 0) {
          console.log(
            "Number of uploaded short files:",
            req.files.shorts?.length || 0
          );

          const validShorts = (req.files.shorts || []).filter(
            (short) =>
              typeof short !== "string" && short.mimetype?.startsWith("video")
          );
          const existingShortCount = (getMovies.shorts || []).filter(
            (id) => typeof id !== "string"
          ).length;

          for (let i = 0; i < validShorts.length; i++) {
            const short = validShorts[i];

            await addTaskToMovieUploadQueue({
              short,
              parsedLanguage,
              parsedGenre,
              title,
              movieId: getMovies._id,
              deductionPoints: eachShortsPoint,
              index: i,
              totalShorts: validShorts.length,
            });

            console.log(short, "shorts....");
          }
          let updatedMovie;
          for (let tries = 0; tries < 60; tries++) {
            updatedMovie = await Movies.findById(getMovies._id);
            const shortsIds = (updatedMovie.shorts || []).filter(
              (id) => typeof id !== "string"
            );
            const allShortsExist = await Promise.all(
              shortsIds.map((id) => Shorts.exists({ _id: id }))
            );
            console.log("allShortsExist", allShortsExist);

            //I need to check actually suppose in db movies contain total 2 shorts previously, now req.body.shorts one short is send and this valid shorts also contain one short in the req.body so I want to check
            //shortsIds length is equal to previously and newly upladed shorts length
            const totalExpectedShorts = existingShortCount + validShorts.length;

            if (
              shortsIds.length === totalExpectedShorts &&
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
              req.body[`shortAudioLanguages_${i}`] || "[]"
            );

            for (let j = 0; j < shortsAudios.length; j++) {
              const audio = shortsAudios[j];
              const langObj = shortsAudioLangs[j] || {};

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

        if (fs.existsSync(thumbnailPath)) {
          console.log("File exists, deleting...");
          fs.unlinkSync(thumbnailPath);
          console.log("Icon deleted successfully");
        } else {
          console.log("File does not exist at path:", thumbnailPath);
        }

        if (visible == false || visible == "false") {
          await Slider.updateMany(
            { linkedMovie: id },
            {
              $set: { visible: false },
            }
          );
          console.log("slider updated");
        }

        const latestMovie = await Movies.findById(getMovies._id);
        return res.status(200).json({ updatedMovie: latestMovie });

        // return res.status(200).json({ updatedMovie: result });
      } catch (err) {
        const newThumbnailPAth = req?.files?.thumbnail[0].path;
        fs.unlink(newThumbnailPAth, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
          } else {
            console.log("File deleted successfully");
          }
        });
        console.error("Error creating document:", err);
      }
    } else {
      const getMovies = await Movies.findById(id);

       const movieId = getMovies._id;
       console.log(movieId, "movieId");


      

      if (!getMovies) {
        return res.status(400).json({ msg: "no data found" });
      }
      await unlinkMovieHandler();
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate date comparison
      console.log(today);

      const expiry = new Date(licenseExpiryDate);
      expiry.setHours(0, 0, 0, 0); // Reset time to midnight for accurate date comparison

      
      try {
        const visibleBool = visible === true || visible === "true";

        const existingMovieWithLanguage = await Movies.findById(movieId).select(
          "language"
        );
        const previousLanguages = (
          existingMovieWithLanguage.language || []
        ).map((id) => id.toString());

        const existingMovieWithLayouts = await Movies.findById(movieId).select(
          "layouts"
        );
        const previousLayouts = (existingMovieWithLayouts.layouts || []).map(
          (id) => id.toString()
        );

        const existingMovieGenre = await Movies.findById(movieId).select(
          "genre"
        );
        const previousGenres = (existingMovieGenre.genre || []).map((id) =>
          id.toString()
        );

        const result = await Movies.findByIdAndUpdate(id, {
          name: title,
          fileLocation: getMovies.fileLocation,
          genre: parsedGenre,
          visible: expiry < today ? false : visibleBool,
          layouts: parsedLayout,
          freeVideos: freeVideos,
          language: parsedLanguage,
          licenseExpiry: licenseExpiryDate,
          screenType: screenType,
        });

        const currentLayouts = parsedLayout.map((id) => id.toString());

        const layoutsToRemove = previousLayouts.filter(
          (id) => !currentLayouts.includes(id)
        );
        if (layoutsToRemove.length > 0) {
          await Layout.updateMany(
            { _id: { $in: layoutsToRemove } },
            { $pull: { linkedMovies: movieId } }
          );
        }
        if (parsedLayout.length > 0) {
          await Promise.all(
            parsedLayout.map((layoutId) => {
              return Layout.findByIdAndUpdate(
                layoutId,
                { $addToSet: { linkedMovies: movieId } }, // add movieId if not already present
                { new: true }
              );
            })
          );
        }

        const currentGenres = parsedGenre.map((id) => id.toString());

        const genresToRemove = previousGenres.filter(
          (id) => !currentGenres.includes(id)
        );
        if (genresToRemove.length > 0) {
          await Genre.updateMany(
            { _id: { $in: genresToRemove } },
            { $pull: { linkedMovies: movieId } }
          );
        }

        if (parsedGenre.length > 0) {
          await Promise.all(
            parsedGenre.map((genreId) => {
              return Genre.findByIdAndUpdate(
                genreId,
                { $addToSet: { linkedMovies: movieId } }, // add movieId if not already present
                { new: true }
              );
            })
          );
        }

        const currentLanguages = parsedLanguage.map((id) => id.toString());


        const languagesToRemove = previousLanguages.filter(
          (id) => !currentLanguages.includes(id)
        );
        

        if (languagesToRemove.length > 0) {
          await Language.updateMany(
            { _id: { $in: languagesToRemove } },
            { $pull: { linkedMovies: movieId } }
          );
        }

        if (parsedLanguage.length > 0) {
          await Promise.all(
            parsedLanguage.map((languageId) => {
              return Language.findByIdAndUpdate(
                languageId,
                { $addToSet: { linkedMovies: movieId } }, // add movieId if not already present
                { new: true }
              );
            })
          );
        }


        if (req?.files?.shorts?.length > 0) {
          console.log(
            "Number of uploaded short files:",
            req.files.shorts?.length || 0
          );
          const validShorts = (req.files.shorts || []).filter(
            (short) =>
              typeof short !== "string" && short.mimetype?.startsWith("video")
          );
          const existingShortCount = (getMovies.shorts || []).filter(
            (id) => typeof id !== "string"
          ).length;
          for (let i = 0; i < validShorts.length; i++) {
            const short = validShorts[i];

            console.log(short, "short....");

            await addTaskToMovieUploadQueue({
              short,
              parsedLanguage,
              parsedGenre,
              title,
              movieId: getMovies._id,
              // deductionPoints: eachShortsPoint,
              index: i,
              totalShorts: validShorts.length,
            });

            console.log(short, "shorts....");
          }
          let updatedMovie;
          for (let tries = 0; tries < 60; tries++) {
            updatedMovie = await Movies.findById(getMovies._id);
            const shortsIds = (updatedMovie.shorts || []).filter(
              (id) => typeof id !== "string"
            );
            const allShortsExist = await Promise.all(
              shortsIds.map((id) => Shorts.exists({ _id: id }))
            );
            console.log("allShortsExist", allShortsExist);

            const totalExpectedShorts = existingShortCount + validShorts.length;

            if (
              shortsIds.length === totalExpectedShorts &&
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
              req.body[`shortAudioLanguages_${i}`] || "[]"
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

        if (req?.files?.trailerAudios && req.files.trailerAudios.length > 0) {
          console.log(req.files.trailerAudios.length);

          const trailerAudioLanguages = JSON.parse(
            req.body.trailerAudioLanguages || "[]"
          );
          if (getMovies?.trailerAudio?.length > 0) {
            for (const audio of getMovies.trailerAudio) {
              if (audio?.audioFileId) {
                try {
                  await deleteAudioFromTencent(audio.audioFileId);
                } catch (err) {
                  console.warn(
                    "Error deleting old Tencent audio:",
                    err.message
                  );
                }
              }

            }
          }

          for (let i = 0; i < req.files.trailerAudios.length; i++) {
            const audio = req.files.trailerAudios[i];
            const langObj = trailerAudioLanguages[i] || {};

            try {
              await addTaskToAudioUploadQueue({
                audio,
                language: langObj.language, // e.g., "English"
                visible: langObj.visible, // e.g., true/false
                movieId: getMovies._id,
                index: i,
                totalAudios: req.files.trailerAudios.length, // Total audios for this movie
              });
            } catch (error) {
              console.error(`Error uploading audio at index ${i}:`, error);
              return res
                .status(500)
                .json({ msg: "Failed to upload trailer audio" });
            } finally {
              // // Clean up temp file
              // fs.unlink(audio.path, (err) => {
              //   if (err)
              //    console.error("Error deleting temp file:", err);
              // });
            }
          }

          // Step 3: Replace old audios with the new ones in DB
          //   await Movies.findByIdAndUpdate(
          //     getMovies._id,
          //     {
          //       trailerAudio: newTrailerAudioArray,
          //       status: "finished" // optional
          //     },
          //     { new: true }
          //   );
        }
      } catch (error) {
        console.error(`Error processing trailer audio at index :`, error);
      }

      let trailerUrlTencent = undefined;
      if (req.files.trailerVideo) {
        const trailerBuffer = fs.readFileSync(
          req?.files?.trailerVideo[0]?.path
        );
        trailerUrlTencent = await uploadVideoToTencent(trailerBuffer);

        // Delete old trailer if exists
        if (getMovies.trailerUrlFileId) {
          await deleteVideoFromTencent(getMovies.trailerUrlFileId);
        }

        // Update with new trailer info
        await getMovies.updateOne({
          trailerName: req?.files?.trailerVideo[0]?.filename,
          trailerUrl: trailerUrlTencent?.multipleQualityUrls[0]?.Url,

          trailerUrlFileId: trailerUrlTencent.fileId,

          low: trailerUrlTencent.multipleQualityUrls[1].Url,
          medium: trailerUrlTencent.multipleQualityUrls[2].Url,
          high: trailerUrlTencent.multipleQualityUrls[3].Url,
        });
        fs.unlink(req?.files?.trailerVideo[0]?.path, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
          } else {
            console.log("File deleted successfully");
          }
        });
      }

      if (visible == false || visible == "false") {
        await Slider.updateMany(
          { linkedMovie: id },
          {
            $set: { visible: false },
          }
        );
        console.log("slider updated without thumbnail");
      }

      const latestMovie = await Movies.findById(getMovies._id);
      return res.status(200).json({ updatedMovie: latestMovie });
      // return res.status(200).json({ msg: "Movie updated successfully" });
    }
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ msg: "Internal server error", error: err.message });
  }
};
