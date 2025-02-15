const mongoose = require("mongoose");
const ApiError = require("../utils/apiError.js");

const errorHandler = (err, req, res, next) => {
    const error = err;
    if ((!error) instanceof ApiError) {
        const statusCode =
            error.statusCode || error instanceof Error ? 400 : 500;
        const message = err.message || "Internal Server Error";
        error = new ApiError(
            statusCode,
            message,
            error?.errors || [],
            err.stack
        );
    }

    const response = {
        ...error,
        message: error.message,
        ...(process.env.NODE_ENV === "development"
            ? { stack: error.stack }
            : {}),
    };
    return res.status(error.statusCode).json(response);
};

module.exports = errorHandler;
