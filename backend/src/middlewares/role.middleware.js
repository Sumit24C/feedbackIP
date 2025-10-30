import { ApiError } from "../utils/apiError.js";

export const verifyRole = (...roles) => (req, _, next) => {
    const userRole = req.user.role;
    if (!roles.includes(userRole)) {
        throw new ApiError(403, "Access denied: insufficient permissions");
    }
    next();
}