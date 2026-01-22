export const DB_NAME = process.env.DB_NAME || "college_feedback"
export const accessTokenExpiry = parseInt(process.env.ACCESS_TOKEN_EXPIRY);
export const refreshTokenExpiry = parseInt(process.env.REFRESH_TOKEN_EXPIRY);
export const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? 'None' : 'Lax',
}
export const FORM_CACHE_TTL = 300;