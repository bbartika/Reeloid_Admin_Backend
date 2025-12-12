const path = require("path");
const fs = require("fs");
const Genre = require("../../models/genre");
const Movies = require("../../models/Movies");

exports.addGenre = async (req, res, next) => {
  const file = req.file;
  const name = req.body.name;
  const linkedMovies = req.body.linkedMovies || [];

  //to find isf this name is already existing in the collection or not
  
  

  const genreImagePath = path.join(__dirname, "..","..", "uploads", "genreImage"); 
  console.log("genreImagePath", genreImagePath);

if (!name || name.length === 0 || name === "") {
    return res.status(400).json({ msg: "Name is required" });
}

if (!file) {
    return res.status(400).json({ msg: "file is required" });
}

const existingGenres = await Genre.find({ name: name });    
if(existingGenres.length > 0){
    return res.status(400).json({ msg: "Genre already exists" });
}

  const pathExists = fs.existsSync(genreImagePath);
  if (!pathExists) {
    fs.mkdirSync(genreImagePath, { recursive: true });
  }

  try {

    let safeLinkedMovies = [];
    if (Array.isArray(linkedMovies)) {
      safeLinkedMovies = linkedMovies;
    } else if (linkedMovies && typeof linkedMovies === "object") {
      safeLinkedMovies = [linkedMovies];
    } else if (typeof linkedMovies === "string" && linkedMovies.trim() !== "") {
      try {
        safeLinkedMovies = JSON.parse(linkedMovies);
        if (!Array.isArray(safeLinkedMovies))
          safeLinkedMovies = [safeLinkedMovies];
      } catch {
        safeLinkedMovies = [];
      }
    }
    const linkedMovieIds = safeLinkedMovies.map((movie) =>
      (movie._id || movie.id).toString()
    );

    const fileName = `${name}_${file.originalname}`;
    const filePath = path.join(genreImagePath, fileName);

    const uploadFile = fs.writeFileSync(filePath, file.buffer);
    
    const saveGenre = await Genre.create({
      name: name,
      icon: `uploads/genreImage/${fileName}`,
      linkedMovies: linkedMovieIds
    });
    if (!saveGenre) {
      return res
        .status(400)
        .json({ msg: "err while saving the genre.plz try again..." });
    }
    // Update each movie's genre field
    for (const movieId of linkedMovieIds) {
      const movie = await Movies.findById(movieId);
      if (movie) {
        if (!movie.genre) movie.genre = [];
        if (!movie.genre.includes(saveGenre._id.toString())) {
          movie.genre.push(saveGenre._id);
          await movie.save();
        }
      }
    }
    return res.status(200).json({ genre: saveGenre });
  } catch (error) {
    return res
        .status(500)
        .json({ msg: "something went wrong",err:error });
  }
};
