export const cronAuth = (req, res, next) => {
    const secret = req.headers["x-cron-secret"];

    if (!secret || secret !== process.env.CRON_SECRET) {
        return res.status(403).json({ message: "Forbidden" });
    }

    next();
};
