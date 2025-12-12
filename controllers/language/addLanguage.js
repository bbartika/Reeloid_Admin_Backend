const path = require("path");
const fs = require("fs");
const language = require("../../models/language");
const Movies = require("../../models/Movies");

exports.addLanguage = async (req, res, next) => {
  const name = req.body.name;
  const linkedMovies = req.body.linkedMovies || [];

  if (!name) {
    return res.status(400).json({ msg: "no language found in input field" });
  }
  // console.log(name)
  try {
    //Extract only the movie IDs
    const linkedMovieIds = linkedMovies.map((movie) => movie._id || movie.id);
    const savedLanguage = await language.create({
      name: name,
      linkedMovies: linkedMovieIds,
    });
    if (!savedLanguage) {
      return res
        .status(400)
        .json({ msg: "err while saving the Language.plz try again..." });
    }
    //I want to iterate through the linkedMovies and add the movie model with this language
    for (const movieId of linkedMovieIds) {
      const movie = await Movies.findById(movieId);
      if (movie) {
        // If your Movie model uses 'language' field:
        if (!movie.language) movie.language = [];
        if (!movie.language.includes(savedLanguage._id.toString())) {
          movie.language.push(savedLanguage._id);
        }
        await movie.save();
      }
    }
    return res.status(200).json({ language: savedLanguage });
  } catch (error) {
    return res.status(500).json({ msg: error });
  }
};
