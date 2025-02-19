const express = require("express");
const {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos,
} = require("../controllers/like.controller.js");

const verifyJWT = require("../middlewares/auth.middleware.js");

const router = express.Router();

// ✅ Like/Unlike Video
router.post("/video/:videoId", verifyJWT, toggleVideoLike);

// ✅ Like/Unlike Comment
router.post("/comment/:commentId", verifyJWT, toggleCommentLike);

// ✅ Like/Unlike Tweet
router.post("/:tweetId", verifyJWT, toggleTweetLike);

// ✅ Get All Liked Videos
router.get("/videos", verifyJWT, getLikedVideos);

module.exports = router;
