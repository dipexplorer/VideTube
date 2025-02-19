const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema(
    {
        video: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
            default: null,
        },
        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            default: null,
        },
        tweet: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tweet",
            default: null,
        },
        likeBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true, // ✅ Like karne wala user required hai
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Like", likeSchema);
