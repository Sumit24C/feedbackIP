export const asyncHandler = async (fn) => (err, req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(err => next(err));
}