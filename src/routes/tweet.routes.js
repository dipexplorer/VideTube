const express = require('express');
const verifyJWT = require("../middlewares/auth.middleware.js");
const {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
} = require("../controllers/tweet.controller.js")

const router = express.Router();


// ✅ Create a tweet
router.post("/", verifyJWT, createTweet);

// ✅ Get all tweets of a specific user
router.get("/:userId", getUserTweets);

// ✅ Update a tweet
router.put("/:tweetId", verifyJWT, updateTweet);

// ✅ Delete a tweet
router.delete("/:tweetId", verifyJWT, deleteTweet);

module.exports = router;