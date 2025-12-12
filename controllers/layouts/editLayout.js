// const Layout = require("../../models/Layout");
// const Movies = require("../../models/Movies");
// const mongoose = require("mongoose");
// const { get } = require("../../routes/admin");
// exports.editLayout = async (req, res, next) => {
//   const { name, Description, linkedMovies, id } = req.body;
//   // console.log(linkedMovies);

//   try {
//     const layoutResponse = await Layout.findById(id).populate("linkedMovies");

//     if (linkedMovies.length > 0) {
//       const moviesResponses = linkedMovies.map(async (currentMovie) => {
//         const getMovie = await Movies.findById(currentMovie._id);

//         if (!getMovie.layouts.includes(id)) {
//           // console.log(getMovie, "....>", id);

//           await getMovie.layouts.push(id);
//           await layoutResponse.linkedMovies.push(currentMovie._id);
//           await getMovie.save();
//         }
//       });

//       await Promise.all(moviesResponses);
//       await layoutResponse.save();
//       return res.status(200).json({ layoutResponse });
//     }
//     return res.status(400).json({ msg: "no movie found" });
//   } catch (err) {
//     return res.status(500).json({ layoutResponse });
//   }
// };
const Layout = require("../../models/Layout");
const Movies = require("../../models/Movies");

exports.editLayout = async (req, res, next) => {
  const { name, Description, linkedMovies = [], id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Layout Id is required" });
  }
  if (!name || name.length === 0 || name === "") {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    // Find the existing layout
    const existingLayout = await Layout.findById(id);
    if (!existingLayout) {
      return res.status(404).json({ error: "Layout not found" });
    }

    // Get old and new linked movie IDs as strings
    const oldLinkedMovieIds = (existingLayout.linkedMovies || []).map(id => id.toString());
    const newLinkedMovieIds = (linkedMovies || []).map(movie => (movie._id || movie.id).toString());

    // Find movies to remove the layout from (in old but not in new)
    const moviesToRemove = oldLinkedMovieIds.filter(id => !newLinkedMovieIds.includes(id));
    

    // Remove layout from movies that are no longer linked
    await Movies.updateMany(
      { _id: { $in: moviesToRemove } },
      { $pull: { layouts: existingLayout._id } }
    );

    // Add layout to newly linked movies
    for (const movieId of newLinkedMovieIds) {
      const movie = await Movies.findById(movieId);
      if (movie) {
        if (!movie.layouts) movie.layouts = [];
        if (!movie.layouts.includes(existingLayout._id.toString())) {
          movie.layouts.push(existingLayout._id);
          await movie.save();
        }
      }
    }

    // Update the layout document
    existingLayout.name = name;
    existingLayout.Description = Description;
    existingLayout.linkedMovies = newLinkedMovieIds;
    await existingLayout.save();

    return res.status(200).json({ message: "Layout updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error while updating layout" });
  }
};