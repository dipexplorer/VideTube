const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const errorHandler = require("./middlewares/error.middleware.js");

dotenv.config(); // Load environment variables

const app = express();

// ✅ CORS Configuration
app.use(
    cors({
        origin: process.env.CORS_ORIGIN || "http://localhost:8000", // Set default for local dev
        credentials: true,
    })
);

// ✅ Body Parser Middleware
// app.use(express.json({ limit: "15kb" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

// ✅ Import Routes
const healthCheckRouter = require("./routes/healthCheck_route.js");
const userRouter = require("./routes/user.route.js");
const videoRouter = require("./routes/video.route.js");
const subscriptionRouter = require("./routes/subscription.route.js");
const commentRouter = require("./routes/comment.routes.js"); // ✅ Import comment routes
const likeRouter = require("./routes/like.routes.js"); // ✅ Import like routes

// ✅ API Routes
app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/comment", commentRouter); // ✅ Mount comment routes
app.use("/api/v1/like", likeRouter);

// ✅ Global Error Handler (Catches All Errors)
app.use((err, req, res, next) => {
    console.error("Error:", err); // Log for debugging

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
});

// app.use(errorHandler);

module.exports = app;
