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

const increaseViewCount = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user?._id; // ✅ Logged-in user ID
    const userIP = req.ip; // ✅ Guest user IP address
    console.log("USER IP WHEN NOT LOGGEDIN", userIP);

    try {
        const video = await Video.findById(id);
        if (!video) {
            return res
                .status(404)
                .json({ success: false, message: "Video not found." });
        }

        // ✅ 1. Check if logged-in user has already watched
        if (userId && video.viewers.includes(userId)) {
            return next(); // Already viewed, move to next middleware
        }

        // ✅ 2. Check if guest user (IP) already viewed (MongoDB)
        const alreadyViewed = video.guestViewers.some(
            (viewer) => viewer.ip === userIP
        );
        if (alreadyViewed) {
            return next(); // Already viewed, move to next middleware
        }

        // ✅ 3. Increase view count & store viewer details
        video.views += 1;
        if (userId) {
            video.viewers.push(userId); // Store user ID (if logged in)
        } else {
            video.guestViewers.push({ ip: userIP, viewedAt: new Date() }); // Store guest IP
        }

        await video.save();
        next(); // Move to next middleware
    } catch (err) {
        console.error("Error updating view count:", err);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
});

const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query,
        sortBy = "name",
        sortType = "asc",
        userId,
    } = req.query;
    console.log("Query Params:", req.query);

    let searchQuery = {};

    // Apply search filter if `query` exists
    if (query) {
        searchQuery.title = {
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

        if (!videos.length) {
            throw new apiError(404, "No videos found");
        }

        const totalVideos =
            (await Video.countDocuments(searchQuery)) || videos.length;

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
        throw new apiError(500, err.message);
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

const getVideoById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new apiError(400, "Video ID is required");
    }
    try {
        const video = await Video.findById(id);
        if (!video) {
            throw new Error("Video not found");
        }
        res.status(200).json(
            new apiResponse(200, video, "Video retrieved successfully")
        );
    } catch (err) {
        console.log("Error retrieving video", err);
        throw new apiError(500, "Server Error");
    }
});

const updateVideo = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new apiError(400, "Video ID is required");
    }
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body;
    const thumbnailLocalPath = req.file?.path;

    if (!title || !description || !thumbnailLocalPath) {
        throw new apiError(
            400,
            "Title, description and thumbnail are required"
        );
    }
    try {
        const video = await Video.findById(id);
        if (!video) {
            throw new Error("Video not found");
        }

        const thumbnailPublicId = video.thumbnail;

        if (thumbnailPublicId) {
            const thumbnailPublicId = thumbnailPublicId
                .split("/")
                .pop()
                .split(".")[0];
            await deleteFromCloudinary(thumbnailPublicId);
        }

        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        if (!thumbnail?.secure_url) {
            throw new Error("Failed to update thumbnail on cloudinary");
        }

        video.title = title || video.title;
        video.description = description || video.description;
        video.thumbnail = thumbnail.secure_url;

        await video.save();

        res.status(200).json(
            new apiResponse(200, video, "Video updated successfully")
        );
    } catch (err) {
        console.log("Error updating video", err);
        throw new apiError(500, "Server Error");
    }
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new apiError(400, "Video ID is required");
    }
    try {
        const video = await Video.findById(id);
        if (!video) {
            throw new Error("Video not found");
        }

        // 🔹 Step 1: Delete thumbnail from Cloudinary
        if (video.thumbnail) {
            const thumbnailPublicId = video.thumbnail
                .split("/")
                .pop()
                .split(".")[0];
            await deleteFromCloudinary(thumbnailPublicId);
        }

        // �� Step 2: Delete video from Cloudinary
        if (video.videoFile) {
            const videoPublicId = video.videoFile
                .split("/")
                .pop()
                .split(".")[0];
            await deleteFromCloudinary(videoPublicId);
        }

        // 🔹 Step 3: Delete video from database
        await Video.findByIdAndDelete(id);

        res.status(200).json(
            new apiResponse(200, null, "Video deleted successfully")
        );
    } catch (err) {
        console.log("Error retrieving video", err);
        throw new apiError(500, "Server error while deleting video");
    }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new apiError(400, "Video ID is required");
    }
    try {
        const video = await Video.findById(id);
        if (!video) {
            throw new Error("Video not found");
        }

        video.isPublished = !video.isPublished;
        await video.save();
        res.status(200).json(
            new apiResponse(
                200,
                video,
                `Video status toggled to ${video.isPublished ? "Public" : "Private"}`
            )
        );
    } catch (err) {
        console.log("Error retrieving video", err);
        throw new apiError(500, "Server error while toggling publish status");
    }
});

module.exports = {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    increaseViewCount,
};
