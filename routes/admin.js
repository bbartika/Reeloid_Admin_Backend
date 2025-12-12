const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { addMovie } = require("../controllers/movies/addMovie");
const { getAllMovies } = require("../controllers/movies/getAllMovies");
const {
  getAllMoviesInAnalytics,
} = require("../controllers/Analytics/getAllMoviesInAnalytics");
const {
  getMoviesAnalytics,
} = require("../controllers/movies/getMoviesAnalytics");
const {
  getPurchasedRevenue,
} = require("../controllers/movies/getPurchasedRevenue");

// const { getTrendingMovies } = require("../controllers/getTrendingMovies");
// const {getAllMoviesWithViews} = require("../controllers/movies/getAllMoviesWithViews");
// const { deleteMovies } = require("../controllers/movies/deleteMovies");
const { getmovie } = require("../controllers/movies/getmovie");
const { editMovie } = require("../controllers/movies/editMovie");

const ChangeSequence = require("../controllers/movies/ChangeSequence");
const { disableVideo } = require("../controllers/movies/disableVideo");
const { enableVideo } = require("../controllers/movies/enableVideo");
const { addAdsInMovie } = require("../controllers/movies/AddAdsInMovie");
const {
  insertCustomAdAtIndex,
} = require("../controllers/movies/insertCustomAdAtIndex");

const { addSlider } = require("../controllers/sliders/addSllider");
const { editSliderData } = require("../controllers/sliders/editSliderData");
const { getAllSliders } = require("../controllers/sliders/getAllSliders");
const { deleteSlider } = require("../controllers/sliders/deleteSlider");

const { addLayout } = require("../controllers/layouts/addLayout");
const { deleteLayout } = require("../controllers/layouts/deleteLAyout");
const { getAllLayout } = require("../controllers/layouts/getAllLayout");
const { getLayoutData } = require("../controllers/layouts/getLayoutData");
const { editLayout } = require("../controllers/layouts/editLayout");
const {
  deleteLayoutLinkedMovies,
} = require("../controllers/deleteLayoutLinkedMovies");
const { deleteShort } = require("../controllers/deleteShort");
const { multipleDeleteShorts } = require("../controllers/multipleDeleteShorts");

const { addGenre } = require("../controllers/genres/addGenre");
const { getGenreData } = require("../controllers/genres/getGenreData");
const { getAllGenre } = require("../controllers/genres/getAllGenre");
const { editGenreData } = require("../controllers/genres/editGenreData");
const { deleteGenre } = require("../controllers/genres/deleteGenre");

const { addLanguage } = require("../controllers/language/addLanguage");
const { getAllLLanguages } = require("../controllers/language/getAllLAnguage");
const { getLanguage } = require("../controllers/language/getLanguage");
const { editLanguage } = require("../controllers/language/editLanguage");
const { deleteLanguage } = require("../controllers/language/deleteLanguage");

const { getAllUsers } = require("../controllers/users/getAllUSers");
const { getUserDetails } = require("../controllers/users/getUserDetails");
const { updateUserDetails } = require("../controllers/users/updateUserDetails");

const {
  getDashboardData,
} = require("../controllers/dashboard/getDAshBoardData");
const {
  fetchContentViews,
} = require("../controllers/dashboard/fetchContentViews");
const { fetchTopMovies } = require("../controllers/dashboard/fetchTopMovies");
const { fetchLatestUser } = require("../controllers/dashboard/fetchLatestUSer");

const { adminLogin } = require("../controllers/auth/adminLogin");
const uploadVideoToTencent = require("../controllers/videoUploader");
const uploadAudioToTencent = require("../controllers/audioUploader");

const checkTaskStatus = require("../controllers/checkTaskStatus");
const { registerAdmin } = require("../controllers/auth/registerAdmin");
const { checkToken } = require("../controllers/auth/checkToken");
const { checkAdmin } = require("../controllers/auth/checkAdmin");

const { addAds } = require("../controllers/advertisements/AddAds");
const { deleteAds } = require("../controllers/advertisements/deleteAds");
const { AllAds } = require("../controllers/advertisements/AllAds");
const { addCustomAds } = require("../controllers/advertisements/AddCustomAds");
const {
  getAllCustomAds,
} = require("../controllers/advertisements/getCustomAds");
const {
  deleteCustomAds,
} = require("../controllers/advertisements/deleteCustomAds");
const {deleteCustomAdsFromMovie } = require("../controllers/advertisements/deleteCustomAdsFromMovie");
const {
  addCheckedInSlide,
} = require("../controllers/checkinTask/addCheckedInSlide");
const {
  fetchCheckedInSlide,
} = require("../controllers/checkinTask/fetchCheckedInSlide");

const {
  sendNotification,
} = require("../controllers/notification/sendNotification");
const {
  saveNotification,
} = require("../controllers/notification/saveNotification");
const { movieFileHandler } = require("../controllers/MovieFileHAndler");
const {
  getMoviesSortedInfo,
} = require("../controllers/Analytics/getMoviesSortedInfo");
const { getShortsInfo } = require("../controllers/Analytics/getShortsInfo");

const { getMovieBySearch } = require("../controllers/getMovieBySearch");

const {
  getRevenueDetails,
} = require("../controllers/Analytics/getRevenueDetails");
const {
  getRevenueAnalysis,
} = require("../controllers/Analytics/getRevenueAnalysis");

const {
  getAllNotification,
} = require("../controllers/notification/getAllNotificationTask");
const { terminateJob } = require("../controllers/TerminateJob");
const {
  getTrendingShorts,
} = require("../controllers/Analytics/getTrendingShorts");

const {
  getNonTrendingMovies,
} = require("../controllers/Analytics/getNonTrendingMovies");
const {
  getNonTrendingShorts,
} = require("../controllers/Analytics/getNonTrendingShorts");

const {
  getAllUsersInAnalytics,
} = require("../controllers/Analytics/getAllUsersInAnalytics");
const { getSpecificUser } = require("../controllers/Analytics/getSpecificUser");

const {
  getUserWithMovie,
} = require("../controllers/Analytics/getUserWithMovie");

const {
  getUsersWithPlan,
} = require("../controllers/Analytics/getUsersWithPlan");

const { AddMintsPlan } = require("../controllers/mintsPlan/AddMintsPlan");
const {
  setShortsDeductionPoints,
} = require("../controllers/movies/setShortsDeductionPoints");
const { AllAdmin } = require("../controllers/Admin/AllAdmin");
const { AllMintsPlan } = require("../controllers/mintsPlan/AllMintsPlan");
const { getSliderData } = require("../controllers/sliders/getSliderData");
const { deleteMovie } = require("../controllers/movies/deleteMovie");
const {
  getAllPublishedMovies,
} = require("../controllers/movies/getAllPublishedMovies");

const { getUsersByPlan } = require("../controllers/Analytics/getUsersByPlan");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Define base upload directory
    const baseUploadDir = path.join(__dirname, "..", "uploads");
    let uploadDir;

    // Customize subdirectories based on fieldname
    switch (file.fieldname) {
      case "thumbnail":
        uploadDir = path.join(baseUploadDir, "thumbnail");
        break;
      case "shorts":
        uploadDir = path.join(baseUploadDir, "shorts");
        break;
      case "trailerVideo":
        uploadDir = path.join(baseUploadDir, "trailerVideo");
        break;
      case "custom_file":
        uploadDir = path.join(baseUploadDir, "custom_file");
        break;
      case "trailerAudios":
        uploadDir = path.join(baseUploadDir, "trailerAudios");
        break;
      case "shortsAudios_0":
        uploadDir = path.join(baseUploadDir, "shortsAudios_0");
        break;
      case "shortsAudios_1":
        uploadDir = path.join(baseUploadDir, "shortsAudios_1");
        break;
      case "shortsAudios_2":
        uploadDir = path.join(baseUploadDir, "shortsAudios_2");
        break;

      default:
        uploadDir = baseUploadDir; // Fallback to base directory
    }

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir); // Set upload directory
  },

  filename: (req, file, cb) => {
    // Define unique file name

    const fileExtension = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const uniqueFileName =
      file.originalname.split(".").slice(0, -1).join(".") +
      "-" +
      uniqueSuffix +
      fileExtension;
    cb(null, uniqueFileName);
    file.modifiedName = uniqueFileName;
  },
});

// Use disk storage and accept multiple file types for specific fields
// const uploadMovieData = multer({ storage: storage });
const uploadMovieData = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit per file
    files: 20, // Maximum number of files
  },
});
const upload = multer();
const routes = express.Router();
routes.post(
  "/Analytics/usersPlanHistory",
  checkToken,
  checkAdmin,
  getUsersWithPlan
);

const shortsCount = 10; // or dynamically set this

const shortsAudioFields = Array.from({ length: shortsCount }, (_, i) => ({
  name: `shortAudio_${i}`,
  maxCount: 10, // or whatever max audios per short
}));

routes.post(
  "/addMovie",
  checkToken,
  checkAdmin,
  uploadMovieData.fields([
    { name: "thumbnail" },
    { name: "shorts" },
    { name: "trailerVideo" },
    { name: "trailerAudios" },
    ...shortsAudioFields,
  ]),
  // movieFileHandler,
  addMovie
);

routes.post(
  "/editMovie",
  checkToken,
  checkAdmin,
  uploadMovieData.fields([
    { name: "thumbnail" },
    { name: "shorts" },
    { name: "trailerVideo" },
    { name: "trailerAudios" },
    ...shortsAudioFields,
  ]),
  // movieFileHandler,
  editMovie
);

routes.post(
  "/addSlider",
  checkToken,
  checkAdmin,
  upload.single("promotionalImage"),
  addSlider
);
routes.get("/getroute", (req, res) => {
  res.send("hello from admin route");
});
routes.post("/addLayout", checkToken, checkAdmin, addLayout);
routes.get("/allMovies", checkToken, checkAdmin, getAllMovies);

routes.get(
  "/analytics/allMovies/:type",
  checkToken,
  checkAdmin,
  getAllMoviesInAnalytics
);
// routes.get("/allMoviesWithViews", checkToken, checkAdmin, getAllMoviesWithViews);
routes.get("/trendingMovies/:type", checkToken, checkAdmin, getMoviesAnalytics);
routes.get("/trendingShorts/:type", checkToken, checkAdmin, getTrendingShorts);

routes.get(
  "/nonTrendingMovies/:type",
  checkToken,
  checkAdmin,
  getNonTrendingMovies
);
routes.get(
  "/nonTrendingShorts/:type",
  checkToken,
  checkAdmin,
  getNonTrendingShorts
);

routes.get(
  "/getPurchasedRevenue/:type",
  checkToken,
  checkAdmin,
  getPurchasedRevenue
);

routes.get(
  "/Analytics/moviesSortedInfo",
  checkToken,
  checkAdmin,
  getMoviesSortedInfo
);
routes.get("/Analytics/shortsInfo/:id", checkToken, checkAdmin, getShortsInfo);

routes.get(
  "/Analytics/searchByMovie",
  checkToken,
  checkAdmin,
  getMovieBySearch
);

routes.get(
  "/Analytics/allUsersInAnalytics",
  checkToken,
  checkAdmin,
  getAllUsersInAnalytics
);

routes.get("/Analytics/getUser/:id", checkToken, checkAdmin, getSpecificUser);
routes.get(
  "/Analytics/userWithMovie",
  checkToken,
  checkAdmin,
  getUserWithMovie
);

routes.get(
  "/Analytics/revenueAnalysis/:type",
  checkToken,
  checkAdmin,
  getRevenueAnalysis
);
routes.get(
  "/Analytics/revenueDetails",
  checkToken,
  checkAdmin,
  getRevenueDetails
);

// routes.get("/trendingMovies", checkToken, checkAdmin, getTrendingMovies);
routes.get("/trendingShorts/:type", checkToken, checkAdmin, getTrendingShorts);

routes.get(
  "/allPublishedMovies",
  checkToken,
  checkAdmin,
  getAllPublishedMovies
);
routes.delete("/deleteMovie/:id", checkToken, checkAdmin, deleteMovie);
routes.get("/getMovie/:id", checkToken, checkAdmin, getmovie);
// routes.get("/getLayouts",checkToken,checkAdmin,getLayout)

routes.get("/allLayouts", checkToken, checkAdmin, getAllLayout);
routes.get("/getLayout/:id", checkToken, checkAdmin, getLayoutData);
routes.post("/editLayout", checkToken, checkAdmin, editLayout);
routes.delete("/deleteShort/:id", checkToken, checkAdmin, deleteShort);
routes.delete(
  "/multipleDeleteShorts",
  checkToken,
  checkAdmin,
  multipleDeleteShorts
);
// deleteLinkedMovie
routes.post(
  "/deleteLinkedMovie",
  checkToken,
  checkAdmin,
  deleteLayoutLinkedMovies
);

routes.get("/allSliders", checkToken, checkAdmin, getAllSliders);
routes.get("/getSlider/:id", checkToken, checkAdmin, getSliderData);
routes.put("/editSlider/:id", checkToken, checkAdmin, editSliderData);
routes.delete("/deleteSlider/:id", checkToken, checkAdmin, deleteSlider);
routes.post(
  "/addGenre",
  checkToken,
  checkAdmin,
  upload.single("icon"),
  addGenre
);
routes.get("/allGenres", checkToken, checkAdmin, getAllGenre);
routes.get("/getGenre/:id", checkToken, checkAdmin, getGenreData);
routes.post(
  "/editGenre",
  checkToken,
  checkAdmin,
  upload.single("icon"),
  editGenreData
);
routes.delete("/deleteGenre/:id", checkToken, checkAdmin, deleteGenre);
routes.post(
  "/addLanguage",
  checkToken,
  checkAdmin,
  upload.single("icon"),
  addLanguage
);

/**
 * @swagger
 * /admin/allLanguages:
 *   get:
 *     summary: Get all languages
 *     tags:
 *       - User
 *     parameters:
 *       - in: header
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: User authentication token
 *     responses:
 *       200:
 *         description: Returns a list of all languages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 languages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "64d21c3e8f6a4a001e6b7331"
 *                       name:
 *                         type: string
 *                         example: "English"
 *       400:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - user is not an admin
 */
routes.get("/allLanguages", checkToken, checkAdmin, getAllLLanguages);

routes.delete("/deleteLanguage/:id", checkToken, checkAdmin, deleteLanguage);

routes.get("/getLanguage/:id", checkToken, checkAdmin, getLanguage);
routes.post("/editLanguage/:id", checkToken, checkAdmin, editLanguage);

routes.delete("/deleteLayout/:id", checkToken, checkAdmin, deleteLayout);
routes.get("/allUsers/:type", checkToken, checkAdmin, getAllUsers);

routes.get("/Analytics/usersByPlan", checkToken, checkAdmin, getUsersByPlan);

/**
 * @swagger
 * /admin/getUserDetails:
 *   post:
 *     summary: Get user details by ID
 *     tags:
 *       - User
 *     parameters:
 *       - in: header
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: User authentication token
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              id:
 *                type: string
 *                example: "64d21c3e8f6a4a001e6b7331"
 *     responses:
 *       200:
 *         description: Returns user details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 userDetails:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "64d21c3e8f6a4a001e6b7331"
 *                     name:
 *                       type: string
 *                       example: "jay gupta"
 *                     email:
 *                       type: string
 *                       example: "appteam@example.com"
 *       400:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - user is not an admin
 */

routes.post("/getUserDetails", checkToken, checkAdmin, getUserDetails);
routes.put("/updateUserDetails", checkToken, checkAdmin, updateUserDetails);
routes.get("/getDashboard/:type", checkToken, checkAdmin, getDashboardData);
routes.get("/getContentViews/:type", checkToken, checkAdmin, fetchContentViews);
routes.get("/fetchTopMovies/:type", checkToken, checkAdmin, fetchTopMovies);

routes.get("/fetchLatestUsers/:type", checkToken, checkAdmin, fetchLatestUser);
/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin related routes
 */

/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 */
routes.post("/login", adminLogin);
routes.post("/registerAdmin", checkToken, checkAdmin, registerAdmin);
routes.get("/testUpload", checkToken, checkAdmin, uploadVideoToTencent);
routes.post("/addPointSlide", checkToken, checkAdmin, addCheckedInSlide);
routes.get("/allCheckedInSlide", checkToken, checkAdmin, fetchCheckedInSlide);
routes.post("/checkTranscodeTask", checkToken, checkAdmin, checkTaskStatus);
routes.post("/addAdsInMovie", checkToken, checkAdmin, addAdsInMovie);
routes.post(
  "/addCustomAdsInMovie",
  checkToken,
  checkAdmin,
  insertCustomAdAtIndex
);
routes.delete("/deleteAds", checkToken, checkAdmin, deleteAds);
routes.post("/disableVideo", checkToken, checkAdmin, disableVideo);
routes.post("/enableVideo", checkToken, checkAdmin, enableVideo);
routes.post(
  "/setShortspoints",
  checkToken,
  checkAdmin,
  setShortsDeductionPoints
);
routes.post("/changeSequence", checkToken, checkAdmin, ChangeSequence);
routes.post("/addAds", checkToken, checkAdmin, addAds);
routes.get("/getAds", checkToken, checkAdmin, AllAds);

routes.post(
  "/addCustomAds",
  checkToken,
  checkAdmin,
  uploadMovieData.fields([{ name: "custom_file" }]),
  addCustomAds
);
routes.get("/getCustomAds", checkToken, checkAdmin, getAllCustomAds);
routes.delete("/deleteCustomAds", checkToken, checkAdmin, deleteCustomAds);
routes.delete("/deleteMovieCustomAds", checkToken, checkAdmin, deleteCustomAdsFromMovie);
routes.post("/saveNotification", saveNotification);
routes.get("/sendMessage", sendNotification);

routes.get("/getAllNotifications", getAllNotification);
routes.post("/addSubscriptionPlan", AddMintsPlan);
routes.get("/terminateJob", terminateJob);
routes.get("/allAdmin", checkToken, checkAdmin, AllAdmin);
routes.get("/allSubscriptionPlan", checkToken, checkAdmin, AllMintsPlan);

module.exports = routes;
