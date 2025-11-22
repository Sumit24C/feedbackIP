import { ApiResponse } from "../utils/apiResponse.js"

export const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode;
    const message = err.message || "something went wrong";

    return res.status(statusCode).json(
        new ApiResponse(statusCode, {}, message, err.errors || [])
    )
}
