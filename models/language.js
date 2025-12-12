const mongoose = require("mongoose");
const languageSchema = new mongoose.Schema( {
  name: String,
  linkedMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movies" }],
},{
  timestamps: true, // This adds createdAt and updatedAt automatically
});
const Language=mongoose.model("languages",languageSchema)
module.exports=Language
