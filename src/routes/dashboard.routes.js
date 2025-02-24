const express = require('express');

const { getChannelStats,
    getChannelVideos, } = require('../controllers/dashboard.controller.js');

const router = express.Router();

// Get Channel Stats
router.get('/:channelId/stats', getChannelStats);

// Get Channel Videos
router.get('/:channelId/videos', getChannelVideos);

module.exports = router;