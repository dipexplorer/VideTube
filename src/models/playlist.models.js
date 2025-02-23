const mongoose = require("mongoose");

const playlistSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        videos: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video",
            },
        ],
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        isPrivate: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Playlist", playlistSchema);
