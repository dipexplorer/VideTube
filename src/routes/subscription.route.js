const express = require("express");
const {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
} = require("../controllers/subscription.controller.js");

const verifyJWT = require("../middlewares/auth.middleware.js");

const router = express.Router();

// ✅ Log Incoming Requests for Debugging
router.use((req, res, next) => {
    console.log("Incoming Request - Method:", req.method, " Path:", req.path);
    next();
});

// ✅ Toggle Subscribe/Unsubscribe
router.route("/:channelId").post(verifyJWT, toggleSubscription);

// ✅ Get all subscribers of a channel
router.route("/:channelId/subscribers").get(getUserChannelSubscribers);

// ✅ Get all channels a user has subscribed to
router.route("/:subscriberId/subscriptions").get(getSubscribedChannels);

module.exports = router;
