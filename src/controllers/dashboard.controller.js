const apiError = require("../utils/apiError");
const apiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

const User = require("../models/user.models.js");
const Video = require("../models/video.models.js");
const Playlist = require("../models/playlist.models.js");
const Comment = require("../models/comment.models.js");
const Like = require("../models/like.models.js");
const Subscription = require("../models/subscription.models.js");

const getChannelStats = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!channelId) {
        throw new apiError(400, "User ID is required.");
    }

    // Count total videos uploaded by the user
    const totalVideos = await Video.countDocuments({ owner: channelId });

    // Aggregate total views on all videos uploaded by the user
    const totalViews = await Video.aggregate([
        { $match: { owner: channelId } },
        { $group: { _id: null, total: { $sum: "$views" } } }
    ]);

    // Aggregate total likes on all videos uploaded by the user
    const totalLikes = await Like.countDocuments({ video: { $in: await Video.find({ owner: channelId }).distinct("_id") } });

    // Count total subscribers
    const totalSubscribers = await Subscription.countDocuments({ channel: channelId });

    const stats = {
        totalVideos,
        totalViews: totalViews.length > 0 ? totalViews[0].total : 0,
        totalLikes,
        totalSubscribers
    };

    res.status(200).json(new apiResponse(200, stats, "Channel stats retrieved successfully."));
});


const getChannelVideos = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!channelId) {
        throw new apiError(400, "User ID is required.");
    }

    const videos = await Video.find({ owner: channelId })
        .select("title thumbnail views createdAt")
        .sort({ createdAt: -1 });

    res.status(200).json(new apiResponse(200, videos, "Channel videos retrieved successfully."));
});


module.exports = {
    getChannelStats,
    getChannelVideos,
}