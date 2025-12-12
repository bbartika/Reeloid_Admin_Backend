const Bull = require("bull");
const redisConfig = {
  redis: {
    host: "localhost", //system where redis has been launched if same server then we use localhost or ip of that server
    port: 6379, //port on which redis server is running
  },
};
//bull uses redis behind the scene so we need to install redis and start the redis server on speciic port where u want to run it it can be different then current server port we can use different ip
exports.deleteRejectedDeviceQueue = new Bull(
  "delete-Rejected-Device-Queue",
  redisConfig
);
exports.sendNotificationtoDeviceQueue = new Bull(
  "send-NotficationTo-Device-Queue",
  redisConfig
);

exports.uploadMoviesQueue = new Bull("uploadMovies-Queue", redisConfig);

exports.uploadAudiosQueue = new Bull("uploadAudios-Queue", redisConfig);

exports.uploadShortAudiosQueue = new Bull(
  "uploadShortAudios-Queue",
  redisConfig
);  

// You have significantly reduced the risk of inconsistency between your application and Redis by following best practices in your code.
// However, you cannot be 100% sure that Redis will never give any inconsistency, because some risks depend on infrastructure and operational factors beyond just your code.

// You only update MongoDB after successfully adding a job to Redis.

// If MongoDB update fails, you remove the job from Redis.

// If a job fails after all retries, you clean up files using the failed event.

// Your queue processor is robust and handles errors properly.