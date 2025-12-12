const mongoose = require("mongoose");
const Language = require("./language");
const movieSchema = new mongoose.Schema(
  {
    status: String,
    name: String,
    genre: String,
    layout: String,
    freeVideos: { type: Number, required: true },
    visible: { type: Boolean, required: true },
    fileLocation: String,
    shorts: [{ type: mongoose.Schema.Types.Mixed, ref: "Shorts" }],
    
    
    shortsJobs: [{ type: mongoose.Schema.Types.Mixed }],
    layouts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Layout" }],
    genre: [{ type: mongoose.Schema.Types.ObjectId, ref: "Genre" }],
    language: [{ type: mongoose.Schema.Types.ObjectId, ref: "Language" }],
    trailerName: String,
    trailerUrl: String,
    trailerUrlFileId: String,
    trailerAudioName: String,
    trailerAudio: [
      {
        _id: false,
        audioName: String,
        language: String,
        visible: { type: Boolean, default: true },
        audioUrl: String,
        audioFileId: String,
      }, 
    ],

    parts: Number,
    views: { type: Number, default: 0 },
    low: String,
    medium: String,
    high: String,
    licenseExpiry: String,
    screenType: String,
    deductionPoints: String,
  },

  {
    timestamps: true, // This adds createdAt and updatedAt automatically
  }
);
const Movies = mongoose.model("movies", movieSchema);
module.exports = Movies;
