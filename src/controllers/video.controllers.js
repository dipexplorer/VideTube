const apiError = require("../utils/apiError");
const apiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/user.models.js");
const mongoose = require("mongoose");
const Video = require("../models/video.models.js");

const {
    uploadOnCloudinary,
    deleteFromCloudinary,
} = require("../utils/cloudinary.js");

const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query,
        sortBy = "name",
        sortType = "asc",
        userId,
    } = req.query;

    let searchQuery = {};

    // Apply search filter if `query` exists
    if (query) {
        searchQuery.name = {
            $regex: query,
            $options: "i",
        };
    }

    // Apply user filter if `userId` exists
    if (userId) {
        searchQuery.userId = mongoose.Types.ObjectId(req.user._id);
    }
    // Apply sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortType === "asc" ? 1 : -1;

    // Pagination
    const skip = (page - 1) * limit;

    try {
        const videos = await Video.find(searchQuery)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const totalVideos = await Video.countDocuments(filter);

        res.status(200).json(
            new apiResponse(
                201,
                videos,
                totalVideos,
                "Videos successfully served"
            )
        );
    } catch (err) {
        console.log("Error while processing search query", err);
        throw new apiError(500, "Server Error");
    }
});

const publishVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    if (!title || !description) {
        throw new apiError(400, "Title and description are required");
    }
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path || null;
    const videoFileLocalPath = req.files?.videoFile?.[0]?.path || null;

    if (!thumbnailLocalPath || !videoFileLocalPath) {
        throw new apiError(400, "Missing video or thumbnail image");
    }

    let thumbnail = "";
    let video = "";

    try {
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        console.log("THUMBNAIL URL", thumbnail);
        if (!thumbnail) {
            throw new Error("No thumbnail available");
        }

        video = await uploadOnCloudinary(videoFileLocalPath);
        console.log("VIDEO URL", video);
        if (!video) {
            throw new Error("No video available");
        }
        const videoData = {
            title,
            description,
            thumbnail: thumbnail.secure_url,
            videoFile: video.secure_url,
            owner: req.user._id,
        };
        const createdVideo = await Video.create(videoData);
        console.log("PUBLISH VIDEO", createdVideo);
        res.status(201).json(
            new apiResponse(201, createdVideo, "Video published successfully")
        );
    } catch (err) {
        console.error("Error publishing video:", err);
        if (thumbnail) {
            await deleteFromCloudinary(thumbnail.public_id);
        }
        if (video) {
            await deleteFromCloudinary(video.public_id);
        }
        throw new apiError(500, "Failed to publish video");
    }
});

module.exports = {
    publishVideo,
};
