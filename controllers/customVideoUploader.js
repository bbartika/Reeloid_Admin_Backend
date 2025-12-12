const tencentcloud = require("tencentcloud-sdk-nodejs");
const COS = require("cos-nodejs-sdk-v5");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const transcodeTencentVideo = require("../controllers/transcodeVideo");
const os = require("os");

dotenv.config();

const VodClient = tencentcloud.vod.v20180717.Client;

// Initialize client with credentials
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

function uploadVideo(videoBuffer) {
  return new Promise((resolve, reject) => {
    const params = {
      MediaType: "MP4",
      SubAppId: 1326678901,
    };
    // Ensure the directory exists
    const tempDir = path.join(__dirname, "..", "uploads", "videoTemp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    // Write to a unique temp file
    const tempVideoPath = path.join(tempDir, `temp_video_${Date.now()}.mp4`);
    fs.writeFileSync(tempVideoPath, videoBuffer);

    client.ApplyUpload(
      params,
      async (applyErr, applyRes) => {
        if (applyErr) {
          fs.unlinkSync(tempVideoPath);
          return reject(applyErr);
        }

        const { StorageBucket, StorageRegion, VodSessionKey, MediaStoragePath } = applyRes;
        const tempCreds = applyRes.TempCertificate;

        try {
          // Initialize COS client
          const cos = new COS({
            SecretId: tempCreds.SecretId,
            SecretKey: tempCreds.SecretKey,
            XCosSecurityToken: tempCreds.Token,
          });

          // Upload video to COS
          await cos.putObject({
            Bucket: StorageBucket,
            Region: StorageRegion,
            Key: MediaStoragePath,
            Body: fs.createReadStream(tempVideoPath),
          });

          // Commit upload
          const commitRes = await new Promise((commitResolve, commitReject) => {
            client.CommitUpload({
              VodSessionKey
            }, (commitErr, data) => {
              commitErr ? commitReject(commitErr) : commitResolve(data);
            });
          });

          // Cleanup temp file
          fs.unlinkSync(tempVideoPath);

          resolve({
            MediaUrl: commitRes.MediaUrl,
            FileId: commitRes.FileId,
          });
        } catch (processErr) {
          reject(processErr);
        }
      }
    );
  });
}

//Final Upload Handler
const uploadCustomVideoToTencent = (video) => {
return uploadVideo(video)
.then(({ FileId }) => {
// Start transcoding with consistent SubAppId
return transcodeTencentVideo(
FileId,
[101305], // Template IDs
client
);
})
.catch(err => {
console.error("Upload failed:", {
code: err.code,
message: err.message,
requestId: err.requestId
});
throw err;
});
};

module.exports = uploadCustomVideoToTencent;
