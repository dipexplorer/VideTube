const mongoose = require("mongoose");
const apiError = require("../utils/apiError");
const apiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/user.models.js");
const Subscription = require("../models/subscription.models.js");

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user._id;

    if (channelId.toString() === userId.toString()) {
        throw new apiError(400, "Cannot subscribe to yourself");
    }
    try {
        const isSubscribed = await Subscription.findOne({
            subscriber: userId,
            channel: channelId,
        });
        if (isSubscribed) {
            await Subscription.findByIdAndDelete(isSubscribed._id);
            return res
                .status(200)
                .json(new apiResponse(200, null, "Unsubscribed successfully"));
        } else {
            const newSubscription = await Subscription.create({
                subscriber: userId,
                channel: channelId,
            });
            return res
                .status(201)
                .json(
                    new apiResponse(
                        201,
                        newSubscription,
                        "Subscribed successfully"
                    )
                );
        }
    } catch (err) {
        console.log(err);
        throw new apiError(400, err.message);
    }
});

// controller to return subscriber list of a channel
// Kisi channel ke sabhi subscribers ka list return karega.
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    try {
        const subscribers = await Subscription.find({ channel: channelId })
            .populate("subscriber", "username email avatar") // ✅ User details fetch karna
            .select("subscriber"); // ✅ Sirf subscriber ka data return karna
        if (!subscribers.length > 0) {
            throw new apiError(404, "No subscribers found for this channel.");
        }
        return res
            .status(200)
            .json(
                new apiResponse(
                    200,
                    subscribers,
                    "Subscriber list retrieved successfully"
                )
            );
    } catch (err) {
        console.error("Error fetching subscribers:", err);
        throw new apiError(500, err.message);
    }
});

// controller to return channel list to which user has subscribed
// Ye controller ek user ke sabhi subscribed channels return karega.
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    try {
        const subscriptions = await Subscription.find({
            subscriber: subscriberId,
        })
            .populate("channel", "username email avatar") // Populate channel details
            .select("channel"); // Only return channel details

        if (!subscriptions.length > 0) {
            throw new apiError(404, "No subscribed channels found.");
        }
        return res
            .status(200)
            .json(
                new apiResponse(
                    200,
                    subscriptions,
                    "Subscribed channel list retrieved successfully"
                )
            );
    } catch (err) {
        console.error("Error fetching subscribed channels:", err);
        throw new apiError(500, err.message);
    }
});

module.exports = {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
};
