const tencentcloud = require("tencentcloud-sdk-nodejs");
const VodClient = tencentcloud.vod.v20180717.Client;

// Use the same client configuration as your transcoding
const clientConfig = {
  credential: {
    // secretId: "IKID67v3DII5iEYikhhmy37DKH8tUxGi4FG6",
     secretId:"IKIDe8XqxtdIv79yeHn7GF4gGdnkV3av380g",
    secretKey: "ZuRq35vrdDj8PXYQ7dv0uc9Y5VkmMqOq",
  },
  region: "ap-hongkong",
  profile: {
    httpProfile: {
      endpoint: "vod.tencentcloudapi.com",
    },
  },
};

const client = new VodClient(clientConfig);

// Generic function to delete media (works for both audio/video)
const deleteMedia = (fileId) => {
  return new Promise((resolve, reject) => {
    const params = {
      FileId: fileId,
      SubAppId: 1326678901, // Same SubAppId as used in transcoding
    };

    client.DeleteMedia(params, (err, response) => {
      if (err) {
        console.error("Error deleting media:", err);
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
};

// Wrapper function specifically for audio
const deleteAudioFromTencent = async (fileId) => {
  try {
    const response = await deleteMedia(fileId);
    console.log("Audio deletion response:", response);
    return { msg: "Audio file deleted from tencent server", status: true };
  } catch (error) {
    console.error("Error deleting audio:", error);
    return { msg: "Error deleting audio", status: false, err: error };
  }
};

module.exports = deleteAudioFromTencent;