const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref: 'Users' // Assuming you have a User model
  },
  image: {
    data: {
      type: String,
    },
    extension: {
      type: String,
    }
  }
});

const UserProfileImage = mongoose.model("userProfileImage", ImageSchema);

module.exports = UserProfileImage;