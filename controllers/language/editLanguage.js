const Language = require("../../models/language");
const Movies = require("../../models/Movies");

exports.editLanguage = async (req, res) => {
  const { id } = req.params;
  const { name, linkedMovies = [] } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Language Id is required" });
  }
  if (!name || name.length === 0 || name === "") {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    // Find the existing language
    const existingLanguage = await Language.findById(id);
    if (!existingLanguage) {
      return res.status(404).json({ error: "Language not found" });
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

    // Get old and new linked movie IDs as strings
    const oldLinkedMovieIds = (existingLanguage.linkedMovies || []).map((id) =>
      id.toString()
    );
    const newLinkedMovieIds = linkedMovies.map((movie) =>
      (movie._id || movie.id).toString()
    );

    // Find movies to remove the language from (in old but not in new)
    const moviesToRemove = oldLinkedMovieIds.filter(
      (id) => !newLinkedMovieIds.includes(id)
    );
    

    // Remove language from movies that are no longer linked
    await Movies.updateMany(
      { _id: { $in: moviesToRemove } },
      { $pull: { language: existingLanguage._id } }
    );

    // Add language to newly linked movies
    for (const movieId of newLinkedMovieIds) {
      const movie = await Movies.findById(movieId);
      if (movie) {
        if (!movie.language) movie.language = [];
        if (!movie.language.includes(existingLanguage._id.toString())) {
          movie.language.push(existingLanguage._id);
          await movie.save();
        }
      }
    }

    // Update the language document
    existingLanguage.name = name;
    existingLanguage.linkedMovies = newLinkedMovieIds;
    await existingLanguage.save();

    return res.status(200).json({ message: "Language updated successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Server error while updating language" });
  }
};
