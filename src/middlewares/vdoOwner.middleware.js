const Video = require("../models/video.models.js");
const apiError = require("../utils/apiError.js");
const asyncHandler = require("../utils/asyncHandler");

const isVideoOwner = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const video = await Video.findById(id);
    if (!video) {
        throw new apiError(404, "Video not found.");
    }

    //check owner or not
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new apiError(403, "You are not the owner of the video.");
    }
    next();
});

module.exports = isVideoOwner;
