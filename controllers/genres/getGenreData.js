const Genre = require("../../models/genre");

exports.getGenreData = async (req, res) => {
const { id } = req.params;
// console.log(id, "id");
try {
    // const genre = await Genre.findById(id);
    // console.log(genre, "genre");
    const response = await Genre.findById(id).populate({
     path: "linkedMovies",
     select: "_id name icon",
    });
    // console.log(response, "response");
    if (!response) {
     return res.status(400).json({ Genre: [] });
    }
    return res.status(200).json({ Genre: response });
} catch (error) {
    return res.status(400).json({ err: error });
}
};