const Movies = require("../../../models/Movies");
const { uploadAudiosQueue } = require("../../../services/bullServices");

exports. addTaskToAudioUploadQueue = async (data) => {
  // console.log("data....", data);
  try {
    // console.log("data>>>>>", data);
    
    const job = await uploadAudiosQueue.add(data);
    console.log("data", data);
    
    // const response = await Movies.findByIdAndUpdate(
    //   data.movieId,
    //   {
    //     $push: {
    //       shortsJobs: job.id,
    //     },
    //   }
    //   // { new: true, upsert: true } //updated new columns
    // );
    // console.log("response....>>>", response);
    return {
      msg: "job added successfully ...shorts will upload soon",
      jobId: job.id,
    };
  } catch (error) {
    console.log("error", error);
    throw new Error(error);
  }
};

