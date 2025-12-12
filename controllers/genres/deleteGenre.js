const Genre = require("../../models/genre");
const Movies = require("../../models/Movies");
const fs = require("fs");
const path = require("path");
const Users = require("../../models/Users");

exports.deleteGenre = async (req, res, next) => {
  const { id } = req.params;
  console.log("id param:", id, typeof id);

  try {
    // First find the genre to be deleted
    const genre = await Genre.findById(id);
    console.log("Genre found:", genre);

    if (!genre) {
      return res.status(404).json({ msg: "Genre not found" });
    }

    // Update all movies to remove this genre
    // await Movies.updateMany({ genre: id }, { $pull: { genre: id } });
    const genreIdStr = id.toString().trim();

    // const users = await Users.find({
    //   selectedGenre: genreIdStr,
    // });
    // console.log("Users with genre:", users);

    await Movies.updateMany(
      { genre: id },
      { $pull: { genre: id } }
    );
  

    const updateResult = await Users.updateMany(
      {},
      { $pull: { selectedGenre: genreIdStr } }
    );
    console.log("Update result:", updateResult);

    // Delete the genre icon if it exists
    if (genre.icon) {
      const iconPath = path.join(__dirname, "..", "..", genre.icon);
      //  console.log("Attempting to delete icon at path:", iconPath);
      //  console.log("Icon name:", genre.icon);

      if (fs.existsSync(iconPath)) {
        console.log("File exists, deleting...");
        fs.unlinkSync(iconPath);
        console.log("Icon deleted successfully");
      } else {
        console.log("File does not exist at path:", iconPath);
      }
    }

    // Finally delete the genre
    await Genre.findByIdAndDelete(id);

    return res.status(200).json({
      msg: "Genre deleted successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      msg: "Something went wrong while deleting genre",
      error: err.message,
    });
  }
};
