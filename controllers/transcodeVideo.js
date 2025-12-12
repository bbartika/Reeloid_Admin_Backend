const checkTaskStatus = require("../controllers/checkTaskStatus");


const transcodeVideo = (fileId, templateIds, client) => {
  return new Promise((resolve, reject) => {
    console.log("Transcoding start");

    const transcodeParams = {
      FileId: fileId,
      MediaProcessTask: {
        TranscodeTaskSet: templateIds.map((templateId) => ({
          Definition: templateId, // Template ID for transcoding
        })),
      },
      SubAppId: 1326678901, // Optional: Pass SubAppId if applicable
    };

    client.ProcessMedia(transcodeParams, (err, response) => {
      if (err) {
        // console.error("Error initiating transcoding:", err);
        reject(err);
      } else {
        // console.log("Transcoding initiated successfully:", response);
        resolve(response.TaskId); // Return the fileId
      }
    });
  });
};

const getTranscodedUrls = (fileId, client) => {
  console.log("FileId passed to getTranscodedUrls:", fileId);
  return new Promise((resolve, reject) => {
    const params = {
      FileIds: [fileId], // FileId of the uploaded media
      SubAppId: 1326678901, // Optional: Pass SubAppId if applicable
    };

    client.DescribeMediaInfos(params, (err, response) => {
      if (err) {
        console.error("Error retrieving media info:", err);
        reject(err);
      } else {
        console.log(response, "response of urls......>");
        const mediaInfo = response.MediaInfoSet[0];
        const transcodedUrls = mediaInfo.TranscodeInfo.TranscodeSet.map(
          (transcode) => {
            console.log(transcode, "....<<>>>>");
            return {
              Definition: transcode.Definition, // Template ID used for transcoding
              Url: transcode.Url, // Transcoded URL
            };
          }
        );

        resolve(transcodedUrls);
      }
    });
  });
};

// const transcodeTencentVideo = (fileId, templateIds, client) => {
//   return transcodeVideo(fileId, templateIds, client)
//     .then((taskId) => {
//       console.log("TaskId from transcodeVideo:", taskId);
//       return checkTaskStatus(taskId, client); // Pass taskId, not fileId
//     })
//     .then((task) => {
//       console.log("Resolved Task from checkTaskStatus:", task);
//       return getTranscodedUrls(task.FileId, client); // Pass FileId to getTranscodedUrls
//     })
//     .then((urls) => {
//       console.log("Transcoded URLs:", urls);
//       return { multipleQualityUrls: urls, fileId: fileId };
//     })
//     .catch((err) => console.error("Error:", err));
// };
const transcodeTencentVideo = (fileId, templateIds, client) => {
  return transcodeVideo(fileId, templateIds, client)
    .then((taskId) => {
      console.log("TaskId from transcodeVideo:", taskId);
      return checkTaskStatus(fileId, taskId); // Pass both fileId and taskId
    })
    .then((task) => {
      console.log("Resolved Task from checkTaskStatus:", task);
      return getTranscodedUrls(task.FileId, client);
    })
    .then((urls) => {
      console.log("Transcoded URLs:", urls);
      return { multipleQualityUrls: urls, fileId: fileId };
    })
    .catch((err) => console.error("Error:", err));
};

module.exports = transcodeTencentVideo;