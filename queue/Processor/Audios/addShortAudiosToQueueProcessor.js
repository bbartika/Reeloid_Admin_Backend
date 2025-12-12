const {
  shortAudiosUploadByQueue
} = require("../../../controllers/shortAudiosUploadByQueue");
const { uploadShortAudiosQueue } = require("../../../services/bullServices");

exports.AddShortsToQueueProcessor = () => {
  try {
    uploadShortAudiosQueue.process((job) => {
      // console.log("job....>>>", job);
      // 1. job will process here and job will automatically comes here because we are using process that means if any job will be pushed in the queue it will execute automatically in queuename.process() and we uses process then that controllers and logic will be run when that item will process
      // 2. we can directly wrote logic here or we can import controllers from different folder it will execute once when its number will come from queue.
      shortAudiosUploadByQueue(job.data);
    });
  } catch (error) {
    console.log(error);
  }
};