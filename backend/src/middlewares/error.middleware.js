import { ApiResponse } from "../utils/apiResponse.js"

export const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode || 500;
    const message = err.message || "something went wrong";

    res.status(statusCode).json(
        new ApiResponse(statusCode, {}, message, err.errors || [])
    );
};
