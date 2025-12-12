const shortsHistory = require('../../models/shortsHistory');

exports.getUserWithMovie = async (req, res) => {
    try {
        const userId = req.query.userId;
        const movieId = req.query.movieId;

        const shortsHistoryData = await shortsHistory.findOne(
            { userId: userId, movieID: movieId },
            { shorts: 1 }
        ).lean();

        if (!shortsHistoryData) {
            return res.status(404).json({
                success: false,
                msg: "No history found for this user and movie"
            });
        }

        // Calculate completion percentage and format shorts data
        const totalShorts = shortsHistoryData.shorts.length;
        const completedShorts = shortsHistoryData.shorts.filter(
            short => short.isWatchedCompletely === true
        ).length;

        const completionPercentage = totalShorts > 0 
            ? Math.round((completedShorts / totalShorts) * 100)
            : 0;

        // Format shorts data array
        const shortsData = shortsHistoryData.shorts.map(short => ({
            // shortName: short.shortName,
            shortId: short.shortId,
            timestamp: short.timestamp,
            isWatchedCompletely: short.isWatchedCompletely
        }));

        return res.status(200).json({
            success: true,
            data: {
                completionPercentage,
                
                data: shortsData
            }
        });

    } catch (error) {
        console.error('Error in getUserWithMovie:', error);
        return res.status(500).json({
            success: false,
            msg: "Error fetching user's movie history",
            error: error.message
        });
    }
};

//This API is used to get about the specific user and the specific movie he has watched
// It returns the watch timings and is this short watched completely or not
//along with the completion percentage of that specific movie
//under every movie the shorts will be shown in the array of objects