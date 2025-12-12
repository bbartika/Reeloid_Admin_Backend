const tencentcloud = require("tencentcloud-sdk-nodejs");
const COS = require("cos-nodejs-sdk-v5");
const fs = require("fs");
const dotenv = require("dotenv");
const transcodeTencentAudio = require("../controllers/transcodeAudio"); // Your audio transcode handler
dotenv.config();

// Vod Client Init
const VodClient = tencentcloud.vod.v20180717.Client;
const clientConfig = {
  credential: {
    secretId: process.env.SECRETID,
    secretKey: process.env.SECRETKEY,
  },
  region: "ap-hongkong",
  profile: {
    httpProfile: {
      endpoint: "vod.tencentcloudapi.com",
    },
  },
};
const client = new VodClient(clientConfig);

// ✅ Step 1: Upload Audio to Tencent Cloud
function uploadAudio(audioFileBuffer) {
  return new Promise((resolve, reject) => {
    const params = {
      // MediaType: "mp3" || "aac" || "mp4", // ✅ for audio 
      MediaType: audioFileBuffer.mimetype || "mp3",
      SubAppId: 1326678901,
    };

    client.ApplyUpload(params, (err, response) => {
      if (err) return reject("ApplyUpload error: " + err.message);

      const { StorageBucket, StorageRegion, VodSessionKey, MediaStoragePath } = response;

      const cos = new COS({
        SecretId: response.TempCertificate.SecretId,
        SecretKey: response.TempCertificate.SecretKey,
        XCosSecurityToken: response.TempCertificate.Token,
      });

      const uploadParams = {
        Bucket: StorageBucket,
        Region: StorageRegion,
        Key: MediaStoragePath,
        Body: audioFileBuffer,
      };

      cos.putObject(uploadParams, (uploadErr, uploadData) => {
        if (uploadErr) return reject("COS upload error: " + uploadErr.message);

        const commitParams = { VodSessionKey };

        client.CommitUpload(commitParams, (commitErr, commitResponse) => {
          if (commitErr) return reject("CommitUpload error: " + commitErr.message);

          resolve({
            MediaUrl: commitResponse.MediaUrl,
            FileId: commitResponse.FileId,
          });
        });
      });
    });
  });
}

// ✅ Step 2: Upload + Transcode Audio using audio-specific template(s)
// const uploadAudioToTencent = (audioBuffer) => {
//   return uploadAudio(audioBuffer)
//     .then((audioData) => {
//       const fileId = audioData.FileId;

//       // 🔁 Use AUDIO TEMPLATE ID(s) only (must be defined in VOD console)
//       const audioTemplateIds = [101391]; // Example: AAC 128kbps template ID

//       return transcodeTencentAudio(fileId, audioTemplateIds, client);
//     })
//     .catch((err) => {
//       console.error("Upload/Transcode audio error:", err);
//       throw err;
//     });
// };
const uploadAudioToTencent = async (audioBuffer) => {
  try {
    // Validate input
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error("Invalid audio buffer");
    }

    // Upload audio
    const audioData = await uploadAudio(audioBuffer);
    if (!audioData?.FileId) {
      throw new Error("Upload failed - no FileId received");
    }

    // Define multiple audio templates for different qualities
    const audioTemplateIds = [
      101391, // AAC 128kbps
      101392, // AAC 64kbps (add your actual template IDs)
      101393  // AAC 32kbps
    ];

    // Transcode with timeout
    const transcodeResult = await Promise.race([
      transcodeTencentAudio(audioData.FileId, audioTemplateIds, client),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Transcoding timeout")), 300000) // 5 minutes timeout
      )
    ]);

    return transcodeResult;
  } catch (err) {
    console.error("Upload/Transcode audio error:", err);
    throw err;
  }
};

// Export the audio uploader
module.exports = uploadAudioToTencent;


