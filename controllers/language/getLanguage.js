const Language = require("../../models/language");

exports.getLanguage = async (req, res) => {
const { id } = req.params;
// console.log(id, "id");
try {
    // const genre = await Genre.findById(id);
    // console.log(genre, "genre");
    const response = await Language.findById(id).populate({
     path: "linkedMovies",
     select: "_id name ",
    });
    // console.log(response, "response");
    if (!response) {
     return res.status(400).json({ language: [] });
    }
    return res.status(200).json({ language: response });
} catch (error) {
    return res.status(400).json({ err: error });
}
};