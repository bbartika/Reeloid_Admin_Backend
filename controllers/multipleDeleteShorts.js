
// const Movies = require("../models/Movies");
// const Shorts = require("../models/Shorts");
// const fs = require("fs");
// const path = require("path");
// const mongoose = require("mongoose");
// const deleteVideoFromTencent = require("./deleteVideoFromTencent");
// const deleteAudioFromTencent = require("./deleteAudioFromTencent");

// exports.multipleDeleteShorts = async (req, res, next) => {
//   //   console.log(req.body.value);
//   const { shortIds, movieId } = req.body;
//   console.log(shortIds, movieId);
//   // console.log(shortIds, req.body);
//   if (!Array.isArray(shortIds)) {
//     return res
//       .status(400)
//       .json({ error: "Invalid input. 'shortIds' must be an array." });
//   }
//   if (shortIds.length == 0) {
//     return res.status(400).json({ error: "ShortIds field is empty" });
//   }
//   try {
//     const deleteShorts = async (shortIds) => {
//       for (const id of shortIds) {
//         const short = await Shorts.findById(id);

//         if (short) {
//           // 1. Delete from Tencent Cloud
//           if (short.fileId) {
//             await deleteVideoFromTencent(short.fileId);
//           } else {
//             console.log("fileId is missing for short:", short);
//             return res.status(400).json({ error: "fileid is missing" });
//           }
//           // 2. Delete all shortAudios from Tencent
//           if (Array.isArray(short.shortAudio)) {
//             for (const audio of short.shortAudio) {
//               if (audio.audioFileId) {
//                 await deleteAudioFromTencent(audio.audioFileId);
//                 console.log(`Deleted short audio: ${audio.audioFileId}`);
//               }
//             }
//           }

//           // 2. Delete from Shorts collection
//           await Shorts.findByIdAndDelete(id);
//         }

//         // 3. Remove from all Movies.shorts arrays
//         const objectId = new mongoose.Types.ObjectId(id);

//         if (!mongoose.Types.ObjectId.isValid(id)) {
//           return res.status(400).json({ msg: "Invalid short ID" });
//         }

//         const result = await Movies.findByIdAndUpdate(
//           movieId,
//           { $pull: { shorts: objectId } }, // <== THIS is the update
//           { new: true } // <== Optional: returns updated document
//         );
//         console.log(result);
//         if (result) {
//   // Filter out any Shorts that are "Ads"
//   const allValidShorts = await Shorts.find({
//     _id: { $in: result.shorts },
//     name: { $ne: "Ads" } // Or any other condition for Ads
//   });

//   // Update the 'parts' field based on actual valid shorts
//   await Movies.findByIdAndUpdate(movieId, {
//     parts: allValidShorts.length
//   });
      

      
//     }
//   }

//     await deleteShorts(shortIds);
//     return res.status(200).json({ msg: "Shorts deleted Successfully" });
//   }
//  } catch (err) {
//     console.log(err);
//     return res.status(500).json({ msg: "something went wrong", err: err });
//   }
// };

const Movies = require("../models/Movies");
const Shorts = require("../models/Shorts");
const mongoose = require("mongoose");
const deleteVideoFromTencent = require("./deleteVideoFromTencent");
const deleteAudioFromTencent = require("./deleteAudioFromTencent");

exports.multipleDeleteShorts = async (req, res, next) => {
  const { shortIds, movieId } = req.body;

  console.log("shortIds", shortIds);


  if (!Array.isArray(shortIds)) {
    return res
      .status(400)
      .json({ error: "Invalid input. 'shortIds' must be an array." });
  }

  if (shortIds.length === 0) {
    return res.status(400).json({ error: "shortIds field is empty." });

  }

  if (!mongoose.Types.ObjectId.isValid(movieId)) {
    return res.status(400).json({ error: "Invalid movieId." });
  }


  try {
    // 1. Find movie once
    const movie = await Movies.findById(movieId);
    if (!movie) {
      return res.status(404).json({ error: "Movie not found." });
    }

    for (const id of shortIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: `Invalid short ID: ${id}` });
      }

      const short = await Shorts.findById(id);
      if (!short) {
        console.warn(`Short not found: ${id}`);
        continue;
      }

      // Delete video from Tencent
      if (short.fileId) {
        await deleteVideoFromTencent(short.fileId);
      } else {
        console.warn(`Missing fileId for short: ${id}`);
      }

      // Delete associated audio files
      if (Array.isArray(short.shortAudio)) {
        for (const audio of short.shortAudio) {
          if (audio.audioFileId) {
            await deleteAudioFromTencent(audio.audioFileId);
            console.log(`Deleted audio: ${audio.audioFileId}`);
          }
        }
      }

      // Delete short from Shorts collection
      await Shorts.findByIdAndDelete(id);

      // Remove from Movie shorts array
      await Movies.updateOne(
        { _id: movieId },
        { $pull: { shorts: new mongoose.Types.ObjectId(id) } }
      );
    }

    // 2. Refresh movie shorts count (excluding "Ads")
    const updatedMovie = await Movies.findById(movieId);
    const validShorts = (updatedMovie.shorts || []).filter(
      (id) => id.toString() !== "Ads"
    );
    updatedMovie.parts = validShorts.length;
    await updatedMovie.save();

    return res.status(200).json({ msg: "Shorts deleted successfully." });
  } catch (err) {
    console.error("Error deleting shorts:", err);
    return res.status(500).json({ error: "Something went wrong.", details: err });
  }
};
