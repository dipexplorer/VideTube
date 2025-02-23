const apiError = require("../utils/apiError");
const apiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

const User = require("../models/user.models.js");
const Video = require("../models/video.models.js");
const Playlist = require("../models/playlist.models.js");

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description, isPrivate } = req.body;
    const userId = req.user._id;
    if (!name) {
        throw new apiError(400, "Name is required");
    }
    //TODO: create playlist
    try {
        const playlist = await Playlist.create({
            name,
            description,
            owner: userId,
            isPrivate: isPrivate || false,
        });
        res.status(201).json(
            new apiResponse(201, playlist, "Playlist created successfully")
        );
    } catch (err) {
        console.log("Error creating playlist", err);
        throw new apiError(500, err.message);
    }
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    //TODO: get user playlists
    if (!userId) {
        throw new apiError(400, "User ID is required");
    }
    try {
        const playlists = await Playlist.find({ owner: userId }).populate("videos", "title thumbnail");
        res.status(200).json(
            new apiResponse(200, playlists, "User playlists fetched successfully")
        );
    } catch (err) {
        console.error("Error fetching user playlists", err);
        throw new apiError(500, err.message);
    }
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    //TODO: get playlist by id
    if (!playlistId) {
        throw new apiError(400, "Playlist ID is required");
    }
    try {
        const playlist = await Playlist.findById(playlistId).populate("videos", "title thumbnail");
        if (!playlist) {
            throw new apiError(404, "Playlist not found");
        }
        res.status(200).json(
            new apiResponse(200, playlist, "Playlist fetched successfully")
        );
    } catch (err) {
        console.error("Error fetching playlist by ID", err);
        throw new apiError(500, err.message);
    }
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    // TODO: add video to playlist
    if (!playlistId || !videoId) {
        throw new apiError(400, "Playlist ID and Video ID are required");
    }
    try {
        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            throw new apiError(404, "Playlist not found");
        }
        const video = await Video.findById(videoId);
        if (!video) {
            throw new apiError(404, "Video not found");
        }
        if (playlist.videos.includes(videoId)) {
            throw new apiError(400, "Video already in playlist.");
        }
        playlist.videos.push(videoId);
        await playlist.save();
        res.status(200).json(
            new apiResponse(200, playlist, "Video added to playlist successfully")
        );
    } catch (err) {
        console.error("Error adding video to playlist", err);
        throw new apiError(500, err.message);
    }
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    // TODO: remove video from playlist
    if (!playlistId || !videoId) {
        throw new apiError(400, "Playlist ID and Video ID are required");
    }
    try {
        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            throw new apiError(404, "Playlist not found");
        }
        if (!playlist.videos.includes(videoId)) {
            throw new apiError(400, "Video not in playlist.");
        }
        playlist.videos = playlist.videos.filter((id) => id !== videoId);
        await playlist.save();
        res.status(200).json(
            new apiResponse(200, playlist, "Video removed from playlist successfully")
        );
    } catch (err) {
        console.error("Error removing video from playlist", err);
        throw new apiError(500, err.message);
    }

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    // TODO: delete playlist
    if (!playlistId) {
        throw new apiError(400, "Playlist ID is required");
    }
    try {
        const playlist = await Playlist.findByIdAndDelete(playlistId);
        if (!playlist) {
            throw new apiError(404, "Playlist not found");
        }
        res.status(200).json(
            new apiResponse(200, playlist, "Playlist deleted successfully")
        );
    } catch (err) {
        console.error("Error deleting playlist", err);
        throw new apiError(500, err.message);
    }
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist
    if (!playlistId) {
        throw new apiError(400, "Playlist ID is required");
    }
    try {
        const playlist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $set: { name, description },
            },
            { new: true }
        );
        if (!playlist) {
            throw new apiError(404, "Playlist not found");
        }
        res.status(200).json(
            new apiResponse(200, playlist, "Playlist updated successfully")
        );
    } catch (err) {
        console.error("Error updating playlist", err);
        throw new apiError(500, err.message);
    }

})

module.exports = {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
}