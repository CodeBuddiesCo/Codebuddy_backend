function requireUser(req, res, next) {
  if (!req.user) {
    res.status(401);
    next({
      error: "You must be logged in to perform this action",
      message: "You must be logged in to perform this action",
      name: "User token not received",
    });
  }
  next();
}

const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return next({
      name: "UnauthorizedError",
      message: "You must be an admin to access this resource",
    });
  }
  next();
};

module.exports = {
  requireUser,
  requireAdmin
}

