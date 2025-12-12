const mongoose = require("mongoose");

const shortsHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        
        ref: 'Users'
    },
    movieID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movies'
    },
    shorts: {
        type: [mongoose.Schema.Types.ObjectId],
        default: [],
        ref: 'Shorts'
    },
    currentShortsId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shorts'
    },
    sortParameter: {
        type: Number,
    }

});

const shortsHistory = mongoose.model("shortsHistory", shortsHistorySchema);

module.exports = shortsHistory;