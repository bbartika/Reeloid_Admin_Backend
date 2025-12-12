const { default: mongoose } = require("mongoose");
const Movies = require("../models/Movies");
const uploadAudioToTencent = require("./audioUploader");

const fs = require("fs");
const path = require("path");

// exports.audioUploadByQueue = async (data) => {
//   try {
//     const trailerAudioPath = data.audio.path;
//     console.log(trailerAudioPath, "trailerAudioPath");

//     // Step 1: Read file buffer
//     const trailerAudioBuffer = fs.readFileSync(trailerAudioPath);

//     // Step 2: Upload to Tencent
//     const trailerAudioUploadResult = await uploadAudioToTencent(trailerAudioBuffer);

//     console.log("Tencent audio uploaded & transcoded:", trailerAudioUploadResult);

//     // Step 3: Delete local file
//     fs.unlink(trailerAudioPath, (err) => {
//       if (err) console.error("Error deleting file:", err);
//       else console.log("Trailer audio deleted successfully");
//     });

//     //I want to store all the data in the temprary array absed on the index serially which will be get from data.index
    
//     // Step 4: Save uploaded audio metadata to the database (in order)
//     const response = await Movies.findByIdAndUpdate(
//       data.movieId,
//       {                                                                               
//         $push: {
//           trailerAudio: {
//             audioName: data.audio.originalname || data.audio.filename,
//             language: data.language,
//             visible: data.visible,
//             audioFileId: trailerAudioUploadResult.fileId,
//             audioUrl: trailerAudioUploadResult.multipleQualityUrls[0].Url
//           }
//         },
//         status: "finished"
//       },
//       { new: true }
//     );

//     console.log("Audio metadata saved for:", response._id);
//   } catch (error) {
//     console.error("Error inside audioUploadByQueue:", error);
//   }
// };
const tempTrailerAudioStore = {};
exports.audioUploadByQueue = async (data) => {
  try {

    console.log(data.audio.path, "audio path");
    if (!fs.existsSync(data.audio.path)) {
      console.error(`File not found: ${data.audio.path}`);
      return;
    }
    // Step 1: Read file buffer
    const trailerAudioBuffer = fs.readFileSync(data.audio.path);

    // Step 2: Upload to Tencent
    const trailerAudioUploadResult = await uploadAudioToTencent(trailerAudioBuffer);

    // Step 3: Delete local file
    fs.unlink(data.audio.path, (err) => {
      if (err) console.error("Error deleting file:", err);
    });

    // Step 4: Store in temporary array at the correct index
    if (!tempTrailerAudioStore[data.movieId]) {
      tempTrailerAudioStore[data.movieId] = {
        array: [],
        count: 0,
        total: data.totalAudios
      };
    }

    // Build the metadata object
    const audioMeta = {
      audioName: data.audio.originalname || data.audio.filename,
      language: data.language,
      visible: data.visible,
      audioFileId: trailerAudioUploadResult.fileId,
      audioUrl: trailerAudioUploadResult.multipleQualityUrls[0].Url
    };

    // Store at the correct index
    tempTrailerAudioStore[data.movieId ].array[data.index] = audioMeta;
    tempTrailerAudioStore[data.movieId].count++;

    // When all uploads are done, update the DB
    if (tempTrailerAudioStore[data.movieId].count === tempTrailerAudioStore[data.movieId].total) {
      await Movies.findByIdAndUpdate(
        data.movieId,
        {
          $set: {
            trailerAudio: tempTrailerAudioStore[data.movieId].array,
            status: "finished"
          }
        },
        { new: true }
      );
      // Clean up
      delete tempTrailerAudioStore[data.movieId];
      console.log("AUDIO UPLOADED");
    }
  } catch (err) {
    console.error(err);
  }
};
