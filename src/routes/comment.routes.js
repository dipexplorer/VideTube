const express = require("express");
const {
    // getVideoComments,
    // addComment,
    updateComment,
    deleteComment,
} = require("../controllers/comment.controller.js");

const verifyJWT = require("../middlewares/auth.middleware.js");

const router = express.Router();

// // ✅ Get all comments for a specific video
// router.get("/video/:videoId", getVideoComments); // ✅ This is the key route for fetching video comments

// // ✅ Add a comment to a video
// router.post("/video/:videoId", verifyJWT, addComment);

// ✅ Update a comment
router.put("/:commentId", verifyJWT, updateComment);

// ✅ Delete a comment
router.delete("/:commentId", verifyJWT, deleteComment);

module.exports = router;
