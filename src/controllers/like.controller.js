const apiError = require("../utils/apiError");
const apiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

const mongoose = require("mongoose");

const User = require("../models/user.models.js");
const Video = require("../models/video.models.js");
const Comment = require("../models/comment.models.js");
const Like = require("../models/like.models.js");
const Tweet = require("../models/tweet.models.js");

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: toggle like on video
    const userId = req.user._id;
    try {
        const video = await Video.findById(videoId);
        if (!video) {
            throw new apiError(404, "Video not found.");
        }

        const existUserLike = await Like.findOne({
            video: videoId,
            likeBy: userId,
        });
        if (existUserLike) {
            await Like.findByIdAndDelete(existUserLike._id);
            video.likesCount -= 1; // ✅ Decrease like count
            return res
                .status(200)
                .json(new apiResponse(200, null, "Like removed successfully."));
        }
        const like = await Like.create({
            video: videoId,
            likeBy: userId,
        });

        video.likesCount += 1; // ✅ Increase like count
        await video.save(); // ✅ Save the updated count

        return res.status(200).json(new apiResponse(200, like, "like video"));
    } catch (err) {
        console.error("Error toggling like on video:", err);
        throw new apiError(500, "Failed to toggle like on video.");
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    //TODO: toggle like on comment
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new apiError(404, "Comment not found.");
    }

    try {
        const existUserLike = await Like.findOne({
            comment: commentId,
            likeBy: userId,
        });
        if (existUserLike) {
            await Like.findByIdAndDelete(existUserLike._id);
            comment.likes -= 1; // ✅ Decrease like count
            return res
                .status(200)
                .json(new apiResponse(200, null, "Like removed successfully."));
        }
        const like = await Like.create({
            comment: commentId,
            likeBy: userId,
        });

        comment.likes += 1; // ✅ Increase like count
        await comment.save(); // ✅ Save the updated count

        return res.status(200).json(new apiResponse(200, like, "like comment"));
    } catch (err) {
        console.error("Error toggling like on comment:", err);
        throw new apiError(500, "Failed to toggle like on comment.");
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    //TODO: toggle like on tweet
    const userId = req.user._id;
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new apiError(404, "Tweet not found.");
    }
    try {
        const existUserLike = await Like.findOne({
            tweet: tweetId,
            likeBy: userId,
        });
        if (existUserLike) {
            await Like.findByIdAndDelete(existUserLike._id);
            tweet.likes -= 1; // ✅ Decrease like count
            return res
                .status(200)
                .json(new apiResponse(200, null, "Like removed successfully."));
        }
        const like = await Like.create({
            tweet: tweetId,
            likeBy: userId,
        });

        tweet.likes += 1; // ✅ Increase like count
        await tweet.save(); // ✅ Save the updated count

        return res.status(200).json(new apiResponse(200, like, "like tweet"));
    } catch (err) {
        console.error("Error toggling like on tweet:", err);
        throw new apiError(500, "Failed to toggle like on tweet.");
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    try {
        const likedVideos = await Like.find({
            likeBy: userId,
            video: { $ne: null },
        }) // ✅ Only video likes
            .populate("video", "title thumbnail owner")
            .sort({ createdAt: -1 });

        return res
            .status(200)
            .json(
                new apiResponse(
                    200,
                    likedVideos,
                    "Liked videos retrieved successfully"
                )
            );
    } catch (err) {
        console.error("Error getting liked videos:", err);
        throw new apiError(500, "Failed to get liked videos.");
    }
});

module.exports = {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos,
};
