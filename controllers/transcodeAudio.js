const checkTaskStatus = require("./checkTaskStatus");

// ✅ Generic function — works for both audio/video
const transcodeMedia = (fileId, templateIds, client) => {
  return new Promise((resolve, reject) => {
    console.log("Audio Transcoding Start");

    const transcodeParams = {
      FileId: fileId,
      MediaProcessTask: {
        TranscodeTaskSet: templateIds.map((templateId) => ({
          Definition: templateId, // Audio template ID
        })),
      },
      SubAppId: 1326678901,
    };

    client.ProcessMedia(transcodeParams, (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response.TaskId);
      }
    });
  });
};

// ✅ Used for both audio/video
const getTranscodedUrls = (fileId, client) => {
  console.log("FileId passed to getTranscodedUrls:", fileId);
  return new Promise((resolve, reject) => {
    const params = {
      FileIds: [fileId],
      SubAppId: 1326678901,
    };

    client.DescribeMediaInfos(params, (err, response) => {
      if (err) {
        console.error("Error retrieving media info:", err);
        reject(err);
      } else {
        const mediaInfo = response.MediaInfoSet[0];
        const transcodedUrls = mediaInfo.TranscodeInfo.TranscodeSet.map((transcode) => {
          return {
            Definition: transcode.Definition,
            Url: transcode.Url,
          };
        });

        resolve(transcodedUrls);
      }
    });
  });
};

// ✅ Final wrapper: Transcode AUDIO using audio templates
const transcodeTencentAudio = (fileId, templateIds, client) => {
  return transcodeMedia(fileId, templateIds, client)
    .then((taskId) => {
      console.log("TaskId from transcodeMedia (audio):", taskId);
      return checkTaskStatus(fileId,taskId);
    })
    .then((task) => {
      console.log("Resolved Audio Transcoding Task:", task);
      return getTranscodedUrls(task.FileId, client);
    })
    .then((urls) => {
      console.log("Transcoded Audio URLs:", urls);
      return { multipleQualityUrls: urls, fileId };
    })
    .catch((err) => {
      console.error("Audio Transcoding Error:", err);
      throw err;
    });
};

module.exports = transcodeTencentAudio;