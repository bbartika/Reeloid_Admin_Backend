const mongoose = require("mongoose");
const database = require("../util/database");

const CustomAdsSchema = new mongoose.Schema({
  name: String,
  ad_type: String,
  type: String,
  
  visible: Boolean,
  customUrl: String,
    customUrlFileId: String,
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
});

const CustomAds = mongoose.model("customads", CustomAdsSchema);

module.exports = CustomAds;