const Users = require("../../models/Users");
const ShortsHistory = require("../../models/shortsHistory");
const UserProfileImage = require("../../models/userProfileImage");

// exports.getAllUsersInAnalytics = async (req, res) => {

//     try {
//         // Get all users with their basic info
//         const users = await Users.find()
//             .select('name email')
//             .sort({ createdAt: -1 })
//             .lean();

//         // Get enriched user data with movie counts and profile images
//         const enrichedUsers = await Promise.all(users.map(async (user) => {
//             //Get unique movieIDs for this user
//             const uniqueMovies = await ShortsHistory.distinct('movieID', { userId: user._id });
//             console.log("uniqueMovies", uniqueMovies);
//             const movieCount = uniqueMovies.length;

//             //want to convert from object id to string
//             const userId = user._id.toString();

//             // Get user's profile image
//             const profileImage = await UserProfileImage.findOne({ userId: userId }).select('image').lean();
//             return {
//                 _id: userId,
//                 data: {
//                     name: user.name,
//                     totalMovies: movieCount,
//                     profileImage: profileImage ? profileImage.image : null
//                 }
//             };
//         }));
// // console.log("enrichedUsers", enrichedUsers);
//         return res.status(200).json({
//             success: true,
//             data: enrichedUsers
//         });
//     } catch (error) {
//         console.error('Error in getAllUsersInAnalytics:', error);
//         return res.status(500).json({
//             success: false,
//             msg: "Error fetching user analytics",
//             error: error.message
//         });
//     }
// }

exports.getAllUsersInAnalytics = async (req, res) => {
  const { start = 0, limit = 10, searched = "" } = req.query;
  const { type } = req.query;
  let matchCondition = {};

  const now = new Date();
  if (type === "Month") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    matchCondition.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
  } else if (type === "Year") {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    matchCondition.createdAt = { $gte: startOfYear, $lte: endOfYear };
  } else if (type === "HalfYear") {
    // Last 6 months from today
    const startOfHalfYear = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const endOfHalfYear = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    matchCondition.createdAt = { $gte: startOfHalfYear, $lte: endOfHalfYear };
  } else if (type === "Week") {
    // Last 7 days including today
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 6);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(now);
    endOfWeek.setHours(23, 59, 59, 999);
    matchCondition.createdAt = { $gte: startOfWeek, $lte: endOfWeek };
  } else if (type === "Day") {
    // Today only
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    matchCondition.createdAt = { $gte: startOfDay, $lte: endOfDay };
  } else if (type !== "All") {
    return res.status(400).json({ message: "Invalid type parameter" });
  }

  // Build filter for search
  let filter = { ...matchCondition };
  if (searched && searched.trim() !== "") {
    filter = {
      $and: [
        matchCondition,
        {
          $or: [
            { name: { $regex: searched, $options: "i" } },
            { email: { $regex: searched, $options: "i" } },
          ],
        },
      ],
    };
  }

  try {
    // Get total count for pagination
    const totalUsersCount = await Users.countDocuments(filter);

    // Get paginated users with their basic info
    const users = await Users.find(filter)
      .select("name email")
      .sort({ createdAt: -1 })
      .skip(limit * start)
      .limit(limit)
      .lean();

    // Get enriched user data with movie counts and profile images
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        // Get unique movieIDs for this user
        const uniqueMovies = await ShortsHistory.distinct("movieID", {
          userId: user._id,
        });
        const movieCount = uniqueMovies.length;

        const userId = user._id.toString();

        // Get user's profile image
        const profileImage = await UserProfileImage.findOne({ userId: userId })
          .select("image")
          .lean();
        return {
          _id: userId,
          data: {
            name: user.name,
            totalMovies: movieCount,
            profileImage: profileImage ? profileImage.image : null,
          },
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: enrichedUsers,
      start,
      limit,
      totalData: totalUsersCount,
      totalPages: Math.ceil(totalUsersCount / limit),
    });
  } catch (error) {
    console.error("Error in getAllUsersInAnalytics:", error);
    return res.status(500).json({
      success: false,
      msg: "Error fetching user analytics",
      error: error.message,
    });
  }
};

//this API is used to get all users in Analytics part along with  name, profile image and total movies watched by the user
