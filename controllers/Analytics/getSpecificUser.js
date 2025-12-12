const shortsHistory = require("../../models/shortsHistory");
const Movies = require("../../models/Movies");

// exports.getSpecificUser = async (req,res)=>{
//     try{
//         const { id } = req.params;

//         //I want to find the movie Ids from the shotsHistory collection where the specifc userId is present
        
//         const movieIds = await shortsHistory.distinct('movieID', { userId: id });
//         console.log("movieIds", movieIds);
        
//         //I wnat to interates over the movieIds and find every movie name and movie's fileLocation in the Movies collection
//         const movies = await Movies.find({ _id: { $in: movieIds } }, 'name fileLocation');
//         //iterate
//         const movieDetails = movies.map(movie => ({
//             movieId: movie._id,
//             movieName: movie.name,
//             fileLocation: movie.fileLocation
//         }));
        
//        console.log("movieDetails", movieDetails);
       
//        //Now I want to find from the shortsHistory collection from the shorts array of object summation of the isWatchedCompletely
//          //and the isWatchedCompletely is true

//         const shortsHistoryData = await shortsHistory.find({ userId: id }).populate("shorts");
//         const shortsDetails = shortsHistoryData.map(short => ({
//             shortsId: short.shorts._id,
//             isWatchedCompletely: short.isWatchedCompletely
//         }));
        
        
//         // const shortsHistoryData = await shortsHistory.find({userId:userId}).populate("movieID").populate("shorts").populate("currentShortsId");
//         if(shortsHistoryData.length === 0){
//             return res.status(400).json({msg:"no data found"})
//         }
//         const movieId = shortsHistoryData[0].movieID._id;
//         const movieName = shortsHistoryData[0].movieID.name;
//         const shorts = shortsHistoryData[0].shorts;
//         const currentShortsId = shortsHistoryData[0].currentShortsId;
//         const sortParameter = shortsHistoryData[0].sortParameter;

//         return res.status(200).json({
//             success:true,
//             data:{
//                 movieId:movieId,
//                 movieName:movieName,
//                 shorts:shorts,
//                 currentShortsId:currentShortsId,
//                 sortParameter:sortParameter
//             }
//         })
//     }
//     catch(error){
//         console.error('Error in getSpecificUser:', error);
//         return res.status(500).json({
//             success: false,
//             msg: "Error fetching movies",
//         });
//     }
// }

exports.getSpecificUser = async (req, res) => {
    try {
        const { id } = req.params;
        const start = parseInt(req.query.start) || 0;
        const limit = parseInt(req.query.limit) || 10;
        const searched = req.query.searched || "";

        // Find the movie Ids from the shortsHistory collection
        const movieIds = await shortsHistory.distinct('movieID', { userId: id });
        // console.log("movieIds", movieIds);

        // Build search filter
        let filter = { _id: { $in: movieIds } };
        if (searched && searched.trim() !== "") {
            filter = {
                ...filter,
                name: { $regex: searched, $options: "i" }
            };
        }

        // Get total count for pagination with search filter
        const totalData = await Movies.countDocuments(filter);
        const totalPages = Math.ceil(totalData / limit);

        // Get all movies in one query with search and pagination
        const movies = await Movies.find(
            filter,
            'name fileLocation'
        )
        .skip(start)
        .limit(limit);

        // Get movies with their details and shorts completion count
        const formattedData = await Promise.all(movies.map(async (movie) => {
            // Get shorts completion count
            const shortsData = await shortsHistory.findOne(
                { userId: id, movieID: movie._id },
                { shorts: 1 }
            ).lean();

            const reactionCount = shortsData?.shorts?.reduce((count, short) => {
                return count + (short.isWatchedCompletely === true ? 1 : 0);
            }, 0) || 0;

            return {
                movieId: movie._id.toString(),
                data: {
                    movieName: movie.name,
                    thumbnail: movie.fileLocation,
                    reactionCount
                }
            };
        }));

        return res.status(200).json({
            success: true,
            data: formattedData,
            start: start.toString(),
            limit: limit.toString(),
            totalData,
            totalPages
        });

    } catch (error) {
        console.error('Error in getSpecificUser:', error);
        return res.status(500).json({
            success: false,
            msg: "Error fetching user's movie history",
            error: error.message
        });
    }
};

//This API is used to get the specific user , and collect informations how many movies the user has watched 
// and from those specifc movies how many shorts the user has watched completely and summation of the shorts watched completelyunder every nmovie
//also pagination is implemented in this API
//and all the movies will be shown along its name , thumbnail and reactioim count which is the summation of the shorts of a movie 