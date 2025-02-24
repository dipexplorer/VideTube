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

// Create a new playlist authenticated by JWT token
router.post("/", verifyJWT, createPlaylist);

// Get all playlists of a user authenticated by JWT token
router.get("/user/:userId", verifyJWT, getUserPlaylists);

// Get a playlist by its ID authenticated by JWT token
router.get("/:playlistId", getPlaylistById);

// Add a video to a playlist authenticated by JWT token
router.post("/:playlistId/:videoId", verifyJWT, addVideoToPlaylist);

// Remove a video from a playlist authenticated by JWT token
router.delete("/:playlistId/:videoId", verifyJWT, removeVideoFromPlaylist);

// Update a playlist authenticated by JWT token
router.put("/:playlistId", verifyJWT, updatePlaylist);

// Delete a playlist authenticated by JWT token
router.delete("/:playlistId", verifyJWT, deletePlaylist);

module.exports = router;