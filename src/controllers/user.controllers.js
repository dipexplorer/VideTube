const apiError = require("../utils/apiError.js");
const apiResponse = require("../utils/apiResponse.js");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/user.models.js");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const {
    uploadOnCloudinary,
    deleteFromCloudinary,
} = require("../utils/cloudinary.js");

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        if (!accessToken || !refreshToken) {
            throw new Error("Failed to generate tokens");
        }

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (err) {
        throw new Error("Error generating access and refresh tokens");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    // console.log("Received Body:", req.body);
    // console.log("Received Files:", req.files);

    const { fullname, email, username, password } = req.body;

    // Validate required fields
    if (!fullname || !email || !username || !password) {
        throw new apiError(400, "All fields are required");
    }

    // Check if user already exists
    const user = await User.findOne({ $or: [{ username }, { email }] });
    if (user) {
        throw new apiError(409, "Username with email already exists");
    }

    // Check for uploaded files
    const avatarLocalPath = req.files?.avatar?.[0]?.path || null;
    const coverLocalPath = req.files?.coverImage?.[0]?.path || null;

    if (!avatarLocalPath) {
        throw new apiError(400, "Missing avatar image");
    }

    let avatar = "";
    let coverImage = "";

    // Upload avatar
    try {
        avatar = await uploadOnCloudinary(avatarLocalPath);
        console.log("AVATR URL", avatar.secure_url);
        if (!avatar) throw new Error("Avatar upload failed");
    } catch (error) {
        console.error("Error uploading avatar:", error);
        throw new apiError(500, "Failed to upload avatar");
    }

    // Upload cover image if provided
    if (coverLocalPath) {
        try {
            coverImage = await uploadOnCloudinary(coverLocalPath);
            console.log("COVER IMAGE URL", coverImage.secure_url);
            if (!coverImage) throw new Error("Cover upload failed");
        } catch (error) {
            console.error("Error uploading cover image:", error);
        }
    }

    // Create user in DB
    try {
        const user = await User.create({
            fullname,
            email,
            username,
            password,
            avatar: avatar.secure_url || "", // Now properly stores the URL
            coverImage: coverImage.secure_url || "", // Defaults to empty string if not uploaded
        });

        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        );

        if (!createdUser) {
            throw new apiError(500, "Failed to create user");
        }

        return res
            .status(201)
            .json(
                new apiResponse(201, createdUser, "User created successfully")
            );
    } catch (err) {
        console.error("Error creating user:", err);
        if (avatar) {
            await deleteFromCloudinary(avatar.public_id);
        }
        if (coverImage) {
            await deleteFromCloudinary(coverImage.public_id);
        }
        throw new apiError(
            500,
            "Failed to create user and images were deleted"
        );
    }
});

const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    console.log("Received Body:", req.body);

    //validate required fields
    if (!username && !email && !password) {
        throw new apiError(400, "All fields are required");
    }

    //find user
    let user = await User.findOne(
        //or operator
        { $or: [{ username }, { email }] }
    );

    //if user not found, throw error
    if (!user) {
        throw new apiError(401, "user not found");
    }

    //validate password
    const isMatch = await user.isPasswordCorrect(password);
    if (!isMatch) {
        throw new apiError(401, "password invalid");
    }

    //generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        user._id
    );

    if (!accessToken || !refreshToken) {
        throw new apiError(500, "Token generation failed");
    }

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options) // ❌ Fix: Use correct key (accessToken)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new apiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "Logged in successfully"
            )
        );
});

const logOutUser = asyncHandler(async (req, res) => {
    console.log("AFTER RUNNING JWT_MIDDLEWARW:", req.user);
    await User.findByIdAndUpdate(
        req.user._id,
        {
            // using set operations
            $set: { refreshToken: undefined },
        },
        {
            new: true,
        }
    );
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    };
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new apiResponse(200, null, "User Logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingAccessToken =
        req.cookies.refreshToken || req.body.refreshToken;
    // console.log("incomingAccessToken:", incomingAccessToken);

    if (!incomingAccessToken) {
        throw new apiError(401, "No refresh token provided");
    }

    try {
        const decodedToken = jwt.verify(
            incomingAccessToken,
            process.env.JWT_REFRESH_TOKEN_SECRET
        );

        if (!decodedToken) {
            throw new apiError(401, "Invalid token");
        }

        // console.log("decodedToken:", decodedToken);

        const userId = decodedToken._id;

        const user = await User.findById(userId);
        if (!user) {
            throw new apiError(401, "User not found");
        }
        // console.log("user:", user);
        if (user.refreshToken !== incomingAccessToken) {
            throw new apiError(401, "Refresh token mismatch or expired");
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        };

        const { accessToken, refreshToken } =
            await generateAccessAndRefreshToken(userId);
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new apiResponse(
                    200,
                    { accessToken, refreshToken },
                    "Access token refresh successfully"
                )
            );
    } catch (err) {
        console.error("JWT Verification Error:", err.name, err.message);
        throw new apiError(401, err.message || "Invalid refresh token");
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    const { oldPassword, newPassword } = req.body;
    console.log("Received Body:", req.body);

    // validate required fields
    if (!oldPassword || !newPassword) {
        throw new apiError(400, "All fields are required");
    }
    // find user
    let user = await User.findById(userId);
    if (!user) {
        throw new apiError(401, "User not found");
    }
    // validate old password
    const isMatch = await user.isPasswordCorrect(oldPassword);
    if (!isMatch) {
        throw new apiError(401, "Incorrect old password");
    }
    // update password
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res
        .status(200)
        .json(new apiResponse(200, null, "Password updated successfully"));
});

const currentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new apiResponse(
                200,
                req.user,
                "User details retrieved successfully"
            )
        );
});

const updateUserDetails = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { fullname } = req.body;
    if (!fullname) {
        throw new apiError(400, "Full name is required");
    }
    const user = await User.findByIdAndUpdate(
        userId,
        {
            $set: { fullname },
        },
        { new: true }
    ).select("-password -refreshToken");
    return res
        .status(200)
        .json(new apiResponse(200, user, "User details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new apiError(400, "Missing avatar image");
    }
    try {
        // Find user
        const user = await User.findById(userId);
        if (!user) {
            throw new apiError(404, "User not found");
        }

        // 🗑️ Delete previous avatar if exists
        if (user.avatar) {
            const publicId = user.avatar.split("/").pop().split(".")[0]; // Extract Cloudinary public_id
            await deleteFromCloudinary(publicId);
        }

        // 📤 Upload new avatar
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        if (!avatar?.secure_url) {
            throw new apiError(500, "Avatar upload failed");
        }

        // Update user avatar
        user.avatar = avatar.secure_url;
        await user.save();
        return res
            .status(200)
            .json(
                new apiResponse(200, user, "User avatar updated successfully")
            );
    } catch (err) {
        console.error("Error uploading avatar:", err);
        throw new apiError(500, "Failed to update avatar");
    }
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new apiError(400, "Missing cover image");
    }

    try {
        // Find user
        const user = await User.findById(userId);
        if (!user) {
            throw new apiError(404, "User not found");
        }

        // ���️ Delete previous cover image if exists
        if (user.coverImage) {
            const publicId = user.coverImage.split("/").pop().split(".")[0]; // Extract Cloudinary public_id
            await deleteFromCloudinary(publicId);
        }

        // �� Upload new cover image
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);
        if (!coverImage?.secure_url) {
            throw new apiError(500, "Cover image upload failed");
        }

        // Update user cover image
        user.coverImage = coverImage.secure_url;
        await user.save();
        return res
            .status(200)
            .json(
                new apiResponse(
                    200,
                    user,
                    "User cover image updated successfully"
                )
            );
    } catch (err) {
        console.error("Error uploading cover image:", err);
        throw new apiError(500, "Failed to update cover image");
    }
});

const getUserProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username) {
        throw new apiError(400, "Username is required");
    }
    const channel = await User.aggregate([
        {
            $match: { username: username.toLowerCase() },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribedTo",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedBy",
            },
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribedBy",
                },
                subscriptionsCount: {
                    $size: "$subscribedTo",
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$subscribedBy.subscriber"],
                        },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                username: 1,
                avatar: 1,
                coverImage: 1,
                fullname: 1,
                subscribersCount: 1,
                subscriptionsCount: 1,
                isSubscribed: 1,
            },
        },
    ]);
    if (!channel.length) {
        throw new apiError(404, "Channel not found");
    }
    return res
        .status(200)
        .json(
            new apiResponse(
                200,
                channel[0],
                "User channel profile retrieved successfully"
            )
        );
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $unwind: "$owner", // Unwind to get the owner as an object
                    },
                ],
            },
        },
    ]);

    if (!user.length) {
        throw new apiError(404, "User not found");
    }
    return res
        .status(200)
        .json(
            new apiResponse(
                200,
                user[0].watchHistory,
                "User watch history retrieved successfully"
            )
        );
});

module.exports = {
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
};
