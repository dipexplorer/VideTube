const express = require("express");
const {
    registerUser,
    loginUser,
    refreshAccessToken,
    logOutUser,
    changeCurrentPassword,
    currentUser,
    updateUserDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserProfile,
    getWatchHistory,
} = require("../controllers/user.controllers.js");

const upload = require("../middlewares/multer.middleware.js");
const verifyJWT = require("../middlewares/auth.middleware.js");

const router = express.Router();

// ✅ Ensure Express JSON Middleware is Applied in `index.js`
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// ✅ Log Incoming Requests for Debugging
router.use((req, res, next) => {
    console.log("Incoming Request - Method:", req.method, " Path:", req.path);
    next();
});

// ✅ Register Route (with file upload)
router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    registerUser
);

// ✅ Login Route (Fix Empty Body Issue)
router.route("/login").post(loginUser);

// ✅ Secure  Route
router.route("/logout").post(verifyJWT, logOutUser);
// ✅ Refresh Access Token Route
router.route("/refresh-token").post(refreshAccessToken);

// ✅ User Profile Routes
router.route("/account").get(verifyJWT, currentUser);
router.route("/update-profile").put(verifyJWT, updateUserDetails);

// ✅ User password change route or Security Route
router.route("/change-password").put(verifyJWT, changeCurrentPassword);

// ✅ Upload Routes
router
    .route("/upload-avatar")
    .post(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
    .route("/upload-cover")
    .post(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

// ✅ User Watch History Routes
router.route("/history").get(verifyJWT, getWatchHistory);

// ✅ User Profile Routes
router.route("/profile/:username").get(verifyJWT, getUserProfile);

module.exports = router;
