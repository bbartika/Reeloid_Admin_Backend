const Genre = require("../../models/genre");
const path = require("path");
const fs = require("fs");
const Movies = require("../../models/Movies");

exports.editGenreData = async (req, res) => {
  const { id, name, linkedMovies = [] } = req.body; // Access name directly from form data
  const file = req.file;

  // console.log("Received form data:", req.body); // Debug log
  // console.log("Received file:", file);

  if (!id) {
    return res.status(400).json({ error: "Genre Id is required" });
  }
  if (!name || name.length === 0 || name === "") {
    console.log("Name is not present");
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const existingGenre = await Genre.findById(id);
    if (!existingGenre) {
      return res.status(404).json({ error: "Genre not found" });
    }

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
    const oldLinkedMovieIds = (existingGenre.linkedMovies || []).map((id) =>
      id.toString()
    );
    const newLinkedMovieIds = safeLinkedMovies.map((movie) =>
      (movie._id || movie.id).toString()
    );

    //  Get old and new linked movie IDs as strings
    //  const oldLinkedMovieIds = (existingGenre.linkedMovies || []).map(id => id.toString());
    //  const newLinkedMovieIds = linkedMovies.map(movie => (movie._id || movie.id).toString());

    // Find movies to remove the genre from (in old but not in new)
    const moviesToRemove = oldLinkedMovieIds.filter(
      (id) => !newLinkedMovieIds.includes(id)
    );
    
    

    // Remove genre from movies that are no longer linked
    await Movies.updateMany(
      { _id: { $in: moviesToRemove } },
      { $pull: { genre: existingGenre._id } }
    );

    // Add genre to newly linked movies
    for (const movieId of newLinkedMovieIds) {
      const movie = await Movies.findById(movieId);
      if (movie) {
        if (!movie.genre) movie.genre = [];
        if (!movie.genre.includes(existingGenre._id.toString())) {
          movie.genre.push(existingGenre._id);
          await movie.save();
        }
      }
    }

    let genreIcon = existingGenre.icon; // Keep existing icon by default

    if (genreIcon) {
      const iconPath = path.join(__dirname, "..", "..", genreIcon);
      // console.log("Attempting to delete icon at path:", iconPath);
      // console.log("Icon name:", genreIcon);

      if (fs.existsSync(iconPath)) {
        console.log("File exists, deleting...");
        fs.unlinkSync(iconPath);
        console.log("Icon deleted successfully");
      } else {
        console.log("File does not exist at path:", iconPath);
      }
    }

    // Handle new file upload if provided
    if (file) {
      const genreImagePath = path.join(
        __dirname,
        "..",
        "..",
        "uploads",
        "genreImage"
      );
      //   console.log("genreImagePath", genreImagePath);
      const fileName = `${name}_${file.originalname}`;
      const filePath = path.join(genreImagePath, fileName);

      // Create directory if it doesn't exist
      if (!fs.existsSync(genreImagePath)) {
        fs.mkdirSync(genreImagePath, { recursive: true });
      }

      // Write new file
      fs.writeFileSync(filePath, file.buffer);
      iconPath = `uploads/genreImage/${fileName}`;

      // Delete old file if exists
      if (existingGenre.icon) {
        const oldFilePath = path.join(__dirname, "..", existingGenre.icon);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      const updatedGenre = await Genre.findByIdAndUpdate(
        id,
        {
          name,
          icon: iconPath,
          linkedMovies: newLinkedMovieIds,
        },
        { new: true }
      );
    } else {
      const updatedGenre = await Genre.findByIdAndUpdate(
        id,
        {
          name,
          linkedMovies: newLinkedMovieIds,
        },
        { new: true }
      );
    }

    return res.status(200).json({ message: "Genre updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error while updating genre" });
  }
};
