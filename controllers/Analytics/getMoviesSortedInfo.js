const Movies = require("../../models/Movies");
const Shorts = require("../../models/Shorts");
const today = new Date();

// exports.getMoviesSortedInfo = async (req, res) => {
//     try {
//         // Get all movies with their shorts IDs
//         const movies = await Movies.find()
//             .select("name views shorts")
//             .sort({ views: -1 })
//             .lean();

//         // Get all shorts views in one query for better performance
//         const allShorts = await Shorts.find()
//             .select("_id views")
//             .lean();

//         // Create a map of short ID to views for quick lookup
//         const shortsViewsMap = {};
//         allShorts.forEach(short => {
//             shortsViewsMap[short._id.toString()] = short.views || 0;
//         });

//         // Process each movie and create array with movieId and data object
//         const formattedData = movies.map(movie => {
//             // Calculate total views of all shorts under this movie
//             const reactionCount = (movie.shorts || []).reduce((acc, shortId) => {
//                 const shortViews = shortsViewsMap[shortId.toString()] || 0;
//                 return acc + shortViews;
//             }, 0);

//             // Create object with movieId and data structure
//             return {
//                 movieId: movie._id.toString(),
//                 data: {
//                     movieName: movie.name,
//                     reactionCount: reactionCount,
//                     views: movie.views || 0
//                 }
//             };
//         });

//         return res.status(200).json({
//             success: true,
//             data: formattedData
//         });
//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             msg: "Error fetching movies info",
//             error: error.message
//         });
//     }
// };

exports.getMoviesSortedInfo = async (req, res) => {
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
    
    try {
        // Combine search filter with matchCondition
        let filter = { ...matchCondition };
        if (searched && searched.trim() !== "") {
            filter = {
                ...matchCondition,
                name: { $regex: searched, $options: "i" }
            };
        }

        await Movies.updateMany(
              { licenseExpiry: { $gte: today.toISOString() }, visible: { $ne: false } },
              { $set: { visible: true } }
            );
        
            // Set visible to false if licenseExpiry < today AND visible is not already false
            await Movies.updateMany(
              { licenseExpiry: { $lt: today.toISOString() }, visible: { $ne: false } },
              { $set: { visible: false } }
            );


        // Get total count for pagination
        const totalMoviesCount = await Movies.countDocuments(filter);
        
        // Get paginated movies with their shorts IDs
        const movies = await Movies.find(filter)
            .select("name views shorts")
            .sort({ views: -1 })
            .skip(limit * start)
            .limit(limit)
            .lean();

        // Get all shorts views in one query for better performance
        const allShorts = await Shorts.find()
            .select("_id views")
            .lean();

        // Create a map of short ID to views for quick lookup
        const shortsViewsMap = {};
        allShorts.forEach(short => {
            shortsViewsMap[short._id.toString()] = short.views || 0;
        });

        // Process each movie and create array with movieId and data object
        const formattedData = movies.map(movie => {
            // Calculate total views of all shorts under this movie
            const reactionCount = (movie.shorts || []).reduce((acc, shortId) => {
                const shortViews = shortsViewsMap[shortId.toString()] || 0;
                return acc + shortViews;
            }, 0);

            // Create object with movieId and data structure
            return {
                movieId: movie._id.toString(),
                data: {
                    movieName: movie.name,
                    reactionCount: reactionCount,
                    views: movie.views || 0
                }
            };
        });

        return res.status(200).json({
            success: true,
            data: formattedData,
            start,
            limit,
            totalData: totalMoviesCount,
            totalPages: Math.ceil(totalMoviesCount / limit)
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: "Error fetching movies info",
            error: error.message
        });
    }
};

//This API is working fine and used to get all movies name, along with their total views in descending order
//and also the total views of all shorts under each movie which will be shown as reaction count 
// Pagination is implemented with start and limit parameters
//  and also searchg mechanism is also implemented