const express = require("express");
const {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    increaseViewCount,
} = require("../controllers/video.controllers.js");

const {
    getVideoComments,
    addComment,
} = require("../controllers/comment.controller.js");

const upload = require("../middlewares/multer.middleware.js");
const verifyJWT = require("../middlewares/auth.middleware.js");
const isVideoOwner = require("../middlewares/vdoOwner.middleware.js");

const router = express.Router();

// ✅ Ensure Express JSON Middleware is Applied in `index.js`
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// ✅ Log Incoming Requests for Debugging
router.use((req, res, next) => {
    console.log("Incoming Request - Method:", req.method, " Path:", req.path);
    next();
});
// search for video
router.route("/search").get(getAllVideos);

// ✅ Video Route (with file upload)
router.route("/:id").get(verifyJWT, increaseViewCount, getVideoById);

// Update video
router
    .route("/:id")
    .put(verifyJWT, isVideoOwner, upload.single("thumbnail"), updateVideo);

// Delete video
router.route("/:id").delete(verifyJWT, isVideoOwner, deleteVideo);

// Toggle Publish Status
router.route("/:id/publish").put(verifyJWT, isVideoOwner, togglePublishStatus);

// ✅ Video Route (with file upload)
router.route("/upload").post(
    verifyJWT,
    upload.fields([
        { name: "thumbnail", maxCount: 1 },
        { name: "videoFile", maxCount: 1 },
    ]),
    publishVideo
);

// ✅ Get all comments of a video
router.get("/:videoId/comments", getVideoComments);

// ✅ Add a comment
router.post("/:videoId/comment", verifyJWT, addComment);

module.exports = router;
