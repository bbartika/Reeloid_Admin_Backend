const { default: mongoose } = require("mongoose");
const Shorts = require("../models/Shorts");
const uploadAudioToTencent = require("./audioUploader");
const Movies = require("../models/Movies");

const fs = require("fs");
const path = require("path");

const tempShortsAudioStore = {};

exports.shortAudiosUploadByQueue = async (data) => {
  try {
    // Step 1: Read file buffer
    const shortAudioBuffer = fs.readFileSync(data.audio.path);

    // Step 2: Upload to Tencent
    const shortAudioUploadResult = await uploadAudioToTencent(shortAudioBuffer);

    // Step 3: Delete local file
    fs.unlink(data.audio.path, (err) => {
      if (err) console.error("Error deleting file:", err);
    });

    // Step 4: Store in temporary array at the correct index
    if (!tempShortsAudioStore[data.shortId]) {
      tempShortsAudioStore[data.shortId] = {
        array: [],
        count: 0,
        total: data.totalAudios,
      };
    }

    // Build the metadata object
    const audioMeta = {
      audioName: data.audio.originalname || data.audio.filename,
      language: data.language,
      visible: data.visible,
      audioFileId: shortAudioUploadResult.fileId,

      audioUrl: shortAudioUploadResult.multipleQualityUrls[0].Url,
    };

    // Store at the correct index
    tempShortsAudioStore[data.shortId].array[data.index] = audioMeta;
    tempShortsAudioStore[data.shortId].count++;

    // When all uploads are done, update the DB
    if (
      tempShortsAudioStore[data.shortId].count ===
      tempShortsAudioStore[data.shortId].total
    ) {
      const short = await Shorts.findById(data.shortId).lean();
      const existingAudios = Array.isArray(short.shortAudio)
        ? short.shortAudio
        : [];

      // Combine old and new audios
      const combinedAudios = [
        ...existingAudios,
        ...tempShortsAudioStore[data.shortId].array,
      ];

      const updateResult = await Shorts.findByIdAndUpdate(
        data.shortId,
        {
          $set: {
            shortAudio: combinedAudios,
            status: "finished",
          },
        },
        { new: true }
      );
      console.log("Short update result:", updateResult);
      // Clean up
      delete tempShortsAudioStore[data.shortId];
    }
  } catch (err) {
    console.error(err);
  }
};
