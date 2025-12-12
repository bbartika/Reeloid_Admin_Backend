const Movies = require("../../../models/Movies");
const { uploadMoviesQueue } = require("../../../services/bullServices");
const fs = require("fs");

exports.addTaskToMovieUploadQueue = async (data) => {

  const job = await uploadMoviesQueue.add(data, { attempts: 3, backoff: 60000 });
    console.log("job...>>>.", job);
  // console.log("data....", data);
  try {
    // console.log("data>>>>>", data);
    // const job = await uploadMoviesQueue.add(data);
    // console.log("job...>>>.", job);

    const response = await Movies.findByIdAndUpdate(
      data.movieId,
      {
        $push: {
          shortsJobs: job.id,
        },
      }
      // { new: true, upsert: true } //updated new columns
    );
    // console.log("response....>>>", response);
    return {
      msg: "job added successfully ...shorts will upload soon",
      jobId: job.id,
    };
  } catch (error) {
    await job.remove();
    console.log("error", error);
    // throw new Error(error);

    // Always delete the file if it exists
    try {
      const filePath = data?.short?.path;
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("File deleted in catch block after failure");
      }
    } catch (unlinkError) {
      console.error("Failed to delete file in catch block:", unlinkError);
    }
  }
};
