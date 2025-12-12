const  Movies  = require('../models/Movies');
const Shorts = require('../models/Shorts');

exports.getMovieBySearch = async (req, res) => {
    const  name  = req.query.name; // Changed from req.params to req.query
    console.log("movie name:", name); 

    try { 
        // Get this specific movie by name
        const movie = await Movies.findOne({ name: name })
            .select("name views shorts")
            .lean(); 

        if (!movie) {
            return res.status(404).json({
                success: false,
                msg: "Movie not found"
            });
        }
        // Get all shorts views in one query for better performance
        const allShorts = await Shorts.find()
            .select("_id views")
            .lean();

        // Create a map of short ID to views for quick lookup
        const shortsViewsMap = {};
        allShorts.forEach(short => {
            shortsViewsMap[short._id.toString()] = short.views || 0;
        });

        
        
        // Calculate total views of all shorts under this movie
         const reactionCount = (movie.shorts || []).reduce((acc, shortId) => {
            const shortViews = shortsViewsMap[shortId.toString()] || 0;
                return acc + shortViews;
        }, 0);

        // Create object with movieId and data structure
         
        

        return res.status(200).json({
            success: true,
            data: [
                {
                    movieId: movie._id.toString(),
                    data: {
                        movieName: movie.name,
                        reactionCount: reactionCount,
                        views: movie.views || 0
                    }
                }
            ]
        });
    } catch (error) {
        console.error('Error in getMovieBySearch:', error);
        return res.status(500).json({
            success: false,
            msg: "Error fetching movies",
            error: error.message
        });
    }
}