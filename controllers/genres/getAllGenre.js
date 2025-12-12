const Genre = require("../../models/genre");
const Users = require("../../models/Users");
// const Movies = require("../../models/Movies");

exports.getAllGenre = async (req, res, next) => {
const { start, limit, searched } = req.query;

let filter = {};

try {
    if (searched && searched.trim() !== "") {
     filter = {
        $or: [{ name: { $regex: searched, $options: "i" } }],
     };
    }
    const totalGenres = await Genre.countDocuments(filter);
    const allGenres = await Genre.find(filter, {
     _id: 1,
     name: 1,
     icon: 1,
     linkedMovies: 1,
    })
     .skip(limit * start)
     .limit(limit);
    // console.log(allGenres)

    

    
    if (!allGenres) {
     return res.status(200).json({ allGenres: [] });
    }

    return res
     .status(200)
     .json({
        allGenres,
        start,
        limit,
        totalData: totalGenres,
        totalPages: Math.ceil(totalGenres / limit),
     });
} catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "something went wrong", err: err });
}
};