const {
  movieUploadByQueue,
} = require("../../../controllers/movieUploadByQueue");

const { uploadMoviesQueue } = require("../../../services/bullServices");
const fs = require("fs").promises;

// Register event handlers first (optional, for clarity)
uploadMoviesQueue.on('failed', async (job, err) => {
  try {
    const filePath = job.data?.short?.path;
    console.log("file path", filePath);
    if (filePath ) {
      await fs.unlink(filePath);
      console.log(`File deleted after job ${job.id} failed all retries.`);
    }
  } catch (unlinkError) {
    console.error("Failed to delete file after job failure:", unlinkError);
  }
});



exports.AddMoviesToQueueProcessor = () => {
  uploadMoviesQueue.process(async (job) => {
  try {
    // uploadMoviesQueue.process((job) => {
      // console.log("job....>>>", job);
      // 1. job will process here and job will automatically comes here because we are using process that means if any job will be pushed in the queue it will execute automatically in queuename.process() and we uses process then that controllers and logic will be run when that item will process
      // 2. we can directly wrote logic here or we can import controllers from different folder it will execute once when its number will come from queue
      await movieUploadByQueue(job.data);
    // });
  } catch (error) {
    console.log(error);
    throw error;
  }
});
};
