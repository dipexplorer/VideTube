const jwt = require("jsonwebtoken");
const User = require("../models/user.models.js");
const apiError = require("../utils/apiError.js");
const apiResponse = require("../utils/apiResponse.js");
const asyncHandler = require("../utils/asyncHandler");

const verifyJWT = asyncHandler(async (req, res, next) => {
    console.log("Cookies Received:", req.cookies);
    console.log("Authorization Header:", req.header("Authorization"));

    const token =
        req.cookies.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    console.log("Extracted Token:", token); // Added for debugging

    if (!token) {
        throw new apiError(401, "Access denied. No token provided.");
    }

    try {
        const decodedToken = jwt.verify(
            token,
            process.env.JWT_ACCESS_TOKEN_SECRET
        );
        console.log("Decoded Token:", decodedToken); // Added for debugging

        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        );
        if (!user) {
            throw new apiError(401, "Invalid token");
        }
        req.user = user;
        next();
    } catch (err) {
        console.error("JWT Verification Error:", err); // Log the actual error
        throw new apiError(401, "Invalid access token.");
    }
});

module.exports = verifyJWT;
