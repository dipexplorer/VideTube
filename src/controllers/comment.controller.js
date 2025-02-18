const mongoose = require("mongoose");
const apiError = require("../utils/apiError");
const apiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/user.models.js");
const Video = require("../models/video.models.js");
const Comment = require("../models/comment.models.js");

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    try {
        const video = await Video.findById(videoId);
        if (!video) {
            throw new apiError(404, "Video not found");
        }
        const comments = await Comment.find({ video: videoId })
            .populate("owner", "username avatar")
            .sort({ createdAt: -1 }) // ✅ Latest comments pehle show karna
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        if (!comments.length > 0) {
            throw new apiError(404, "No comments found for this video");
        }
        return res
            .status(200)
            .json(
                new apiResponse(
                    200,
                    comments,
                    "comments retrieved successfully"
                )
            );
    } catch (err) {
        console.error("Error getting video comments:", err);
        throw new apiError(500, err.message);
    }
});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { content } = req.body;
    if (!content) {
        throw new apiError(400, "Content is required");
    }
    const { videoId } = req.params;
    const userId = req.user._id;
    try {
        const video = await Video.findById(videoId);
        if (!video) {
            throw new apiError(404, "Video not found");
        }
        const comment = await Comment.create({
            content,
            owner: userId,
            video: videoId,
        });
        return res
            .status(201)
            .json(
                new apiResponse("201", comment, "comment added successfully")
            );
    } catch (err) {
        console.error("Error adding comment:", err);
        throw new apiError(500, err.message);
    }
});

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { newContent } = req.body;
    if (!newContent) {
        throw new apiError(400, "Updated text is required.");
    }
    const { commentId } = req.params;
    const userId = req.user._id;
    try {
        const comment = await Comment.findById(commentId);
        if (!comment) {
            throw new apiError(404, "Comment not found.");
        }
        if (comment.owner.toString() !== userId.toString()) {
            throw new apiError(
                403,
                "You must be an authorized owner to update this comment."
            );
        }
        comment.content = newContent;
        await comment.save();

        return res
            .status(200)
            .json(
                new apiResponse(200, comment, "Comment updated successfully")
            );
    } catch (err) {
        console.error("Error updating comment:", err);
        throw new apiError(500, err.message);
    }
});

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
    const userId = req.user._id;
    try {
        const comment = await Comment.findById(commentId);
        if (!comment) {
            throw new apiError(404, "Comment not found.");
        }
        if (comment.owner.toString() !== userId.toString()) {
            throw new apiError(
                403,
                "You must be an authorized owner to delete this comment."
            );
        }
        await Comment.findByIdAndDelete(commentId);
        return res
            .status(204)
            .json(new apiResponse(204, null, "Comment deleted successfully"));
    } catch (err) {
        console.error("Error deleting comment:", err);
        throw new apiError(500, err.message);
    }
});

module.exports = { getVideoComments, addComment, updateComment, deleteComment };
