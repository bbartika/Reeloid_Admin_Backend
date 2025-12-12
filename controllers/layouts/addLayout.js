const Layout = require("../../models/Layout");
const Movies = require("../../models/Movies");
const mongoose = require("mongoose");
const { get } = require("../../routes/admin");

exports.addLayout = async (req, res, next) => {
  const { name, Description, linkedMovies, visible } = req.body;
  if (!name) {
    return res.status(400).json({ msg: "please provide name for layout" });
  }
  if (visible === "true" && linkedMovies.length == 0) {
    return res.status(400).json({
      msg: "You need to link a movie because you want to make this layout visible otherwise you can select visibility as false",
    });
  }
  // console.log(linkedMovies,"...>");
  // return;

  //   console.log(movies);
  try {
    // Extract only the movie IDs
    const linkedMovieIds = linkedMovies.map(movie => movie._id || movie.id);
    
    const layoutResponse = await Layout.create({
      name: name,
      Description: Description,
      visible,
      linkedMovies: linkedMovieIds,
    });

    // if (linkedMovies.length > 0) {
    //   const moviesResponses = [];

    //   for (const currentMovie of linkedMovies) {
    //     const getMovie = await Movies.findById(currentMovie._id);
    //     if (getMovie) {
    //       // console.log(getMovie, "getMovie");
    //       console.log(layoutResponse, "layout response.......");

    //       getMovie.layouts.push(layoutResponse._id);
    //       layoutResponse.linkedMovies.push(getMovie._id);

    //       // Save the movie
    //       await getMovie.save();
    //       // console.log(await layoutResponse.save(), "......new response");

    //       // Store the promise result if needed
    //       moviesResponses.push(getMovie);
    //     }
    //   }

    //   // If you need to do something with moviesResponses, you can do that here
    // }

    if (!layoutResponse) {
      return res.status(400).json({ msg: "Error while saving the layout. Please try again..." });
    }

    // Add this layout to each movie's layouts array
    for (const movieId of linkedMovieIds) {
      const movie = await Movies.findById(movieId);
      if (movie) {
        if (!movie.layouts) movie.layouts = [];
        if (!movie.layouts.includes(layoutResponse._id.toString())) {
          movie.layouts.push(layoutResponse._id);
          await movie.save();
        }
      }
    }

    
    // console.log(layoutResponse);
    return res.status(200).json({ layoutResponse });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "something went wrong", err: err });
  }
};
