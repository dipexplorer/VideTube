const express = require('express');
const {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
} = require("../controllers/playlist.controller.js");

const verifyJWT = require("../middlewares/auth.middleware.js");

const router = express.Router();

router.post("/", verifyJWT, createPlaylist);
router.get("/user", verifyJWT, getUserPlaylists);
router.get("/:playlistId", getPlaylistById);
router.post("/:playlistId/:videoId", verifyJWT, addVideoToPlaylist);
router.delete("/:playlistId/:videoId", verifyJWT, removeVideoFromPlaylist);
router.put("/:playlistId", verifyJWT, updatePlaylist);
router.delete("/:playlistId", verifyJWT, deletePlaylist);

module.exports = router;