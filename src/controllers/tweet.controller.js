const apiError = require("../utils/apiError");
const apiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

const mongoose = require("mongoose");

const User = require("../models/user.models.js");
const Tweet = require("../models/tweet.models.js")

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;
    const userId = req.user._id;
    if (!content) {
        throw new apiError(400, "Content is required.")
    }
    try {
        const tweet = await Tweet.create({
            content,
            owner: userId,
        });

        return res.status(201).json(
            new apiResponse("201", tweet, "Tweet created successfully")
        )
    } catch (err) {
        console.log("ERROR WHILE ADDING TWEET:", err);
        throw new apiError(500, err.message);
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params;
    const isValidUser = await User.findById(userId);
    if (!isValidUser) {
        throw new apiError(404, "User is not valid.");
    }
    try {
        const tweets = await Tweet.find({ owner: userId })
            .populate("owner", "username email")
            .sort({ createdAt: -1 });
        // If user has not created any tweets yet
        if (!tweets.length > 0) {
            return res.status(200).json(
                new apiResponse("200", [], "User not created any tweets yet.")
            )
        }

        return res.status(200).json(
            new apiResponse("200", tweets, "Tweets retrieved successfully")
        )
    } catch (err) {
        console.log("ERROR WHILE GETTING USER TWEETS:", err);
        throw new apiError(500, err.message);
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;
    if (!content) {
        throw new apiError(400, "Content is required.")
    }
    try {
        const tweet = await Tweet.findById(tweetId);
        if (!tweet) {
            throw new apiError(404, "Tweet not found.");
        }
        if (tweet.owner.toString() !== userId.toString()) {
            throw new apiError(403, "You are not authorized to update this tweet.");
        }
        tweet.content = content;
        await tweet.save();
        return res.status(200).json(
            new apiResponse("200", tweet, "Tweet updated successfully")
        )
    } catch (err) {
        console.log("ERROR WHILE UPDATING TWEET:", err);
        throw new apiError(500, err.message);
    }
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;
    const userId = req.user._id;
    if (!tweetId) {
        throw new apiError(400, "Tweet ID is required.")
    }
    try {
        const tweet = await Tweet.findById(tweetId);
        if (!tweet) {
            throw new apiError(404, "Tweet not found.");
        }
        if (tweet.owner.toString() !== userId.toString()) {
            throw new apiError(403, "You are not authorized to delete this tweet.");
        }
        await tweet.remove();
        return res.status(200).json(
            new apiResponse("200", tweet, "Tweet deleted successfully")
        )
    } catch (err) {
        console.log("ERROR WHILE DELETING TWEET:", err);
        throw new apiError(500, err.message);
    }
})

module.exports = {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}