const express = require("express");
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swaggerConfig');
const cors = require("cors");
const path = require("path");
const connectDb = require("./util/database");
require("./models/Admin");
require("./models/DailyCheckInTask");
require("./models/Layout");
require("./models/Movies");
require("./models/paidMintsBuyer");
require("./models/Shorts");
require("./models/Slider");
require("./models/Users");
require("./models/genre");
require("./models/language");
require("./models/checkInPoints");
const app = express();
connectDb();

app.use(express.json());
app.use(cors({ origin: "*" }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(
  "/thumbnails",
  express.static(path.join(__dirname, "uploads", "thumbnail"))
);

app.use("/video", express.static(path.join(__dirname, "uploads", "shorts")));
app.use("/video", express.static  (path.join(__dirname, "uploads", "custom_file")));

app.use("/audio", express.static(path.join(__dirname, "uploads", "trailerAudios")));
app.use("/shortaudio", express.static(path.join(__dirname, "uploads", "shortAudio")));

// app.use("/shortAudio", express.static(path.join(__dirname, "uploads", "shortsAudios_0")));
// app.use("/shortAudio", express.static(path.join(__dirname,"uploads","shortsAudios_1")));
// app.use("/shortAudio", express.static(path.join(__dirname,"uploads","shortAudios_2")));

app.use(
  "/genreIcon",
  express.static(path.join(__dirname, "uploads", "genreImage"))
);

const adminRoutes = require("./routes/admin");
const {
  DeleteNotificationDeviceProcessor,
} = require("./queue/Processor/Notification/DeleteNotificationDevicesProcessor");
const {
  SendNotificationToDeviceProcessor,
} = require("./queue/Processor/Notification/SendNotificationToDeviceProcessor");
const {
  AddMoviesToQueueProcessor,
} = require("./queue/Processor/Movies/AddMoviesToQueueProcessor");

const {
  AddAudiosToQueueProcessor,
} = require("./queue/Processor/Audios/AddAudiosToQueueProcessor");

const {
  AddShortsToQueueProcessor
  
} = require("./queue/Processor/Audios/addShortAudiosToQueueProcessor");


DeleteNotificationDeviceProcessor();
SendNotificationToDeviceProcessor();
AddMoviesToQueueProcessor();
AddAudiosToQueueProcessor();
AddShortsToQueueProcessor();

app.use("/admin", adminRoutes);

const fs = require("fs");


const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

const shortsDir = path.join(__dirname, "uploads", "shorts");


fs.readdir(shortsDir, (err, files) => {
  if (err) return console.error(err);
  files.forEach(file => {
    const filePath = path.join(shortsDir, file);
    fs.stat(filePath, (err, stats) => {
      if (err) return;
      const now = Date.now();
      if (now - stats.mtimeMs > MAX_AGE_MS) {
        fs.unlink(filePath, err => {
          if (!err) {
            console.log(`Deleted stale temp file: ${filePath}`);
          }
        });
      }
    });
  });
}); 

app.listen(8765, () => {
  console.log("app is running on server 8765");
});
