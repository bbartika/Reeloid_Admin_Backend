const mongoose = require("mongoose");
const shortsSchema = new mongoose.Schema(
  {
    name: String,
    fileLocation: String,
    fileId: String,
    genre: String,
    visible: { type: Boolean, required: true },
    Movies: { type: mongoose.Schema.Types.ObjectId, ref: "Movies" },
    genre: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movies" }],
    language: [{ type: mongoose.Schema.Types.ObjectId, ref: "Language" }],
    shortAudio: [
      {
        _id: false,
        audioName: String,
        language: String,
        visible: { type: Boolean, default: true },
        audioUrl: String,
        audioFileId: String,
      }, 
    ],
    views: { type: Number, default: 0 },
    low: String,
    medium: String,
    high: String,
    deductionPoints: { type: String, default: 0 },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt automatically
  }
);
const Shorts = mongoose.model("shorts", shortsSchema);

// console.log(result);
module.exports = Shorts;
