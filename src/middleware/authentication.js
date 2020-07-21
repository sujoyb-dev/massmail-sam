module.exports = {
  isLoggedIn: (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/");
  },

  isRecruiter: (req, res, next) => {
    if (req.user && req.user.role === "recruiter") return next();
    let error = new Error();
    error.message = "You were supposed to restore the force not destroy it.";
    error.status = 403;
    next(error);
  },
  isRecruiterOrAdmin: (req, res, next) => {
    if (
      req.user &&
      (req.user.role === "recruiter" || req.user.role === "admin")
    )
      return next();
    let error = new Error();
    error.message = "You were supposed to restore the force not destroy it.";
    error.status = 403;
    next(error);
  },
  isVendor: (req, res, next) => {
    if (req.user && req.user.role === "vendor") return next();
    let error = new Error();
    error.message = "You were supposed to restore the force not destroy it.";
    error.status = 403;
    next(error);
  },
  isVendorOrAdmin: (req, res, next) => {
    if (req.user && (req.user.role === "vendor" || req.user.role === "admin"))
      return next();
    let error = new Error();
    error.message = "You were supposed to restore the force not destroy it.";
    error.status = 403;
    next(error);
  },
  isAdmin: (req, res, next) => {
    return next();
    if (req.user && req.user.role === "admin") return next();
    let error = new Error();
    error.message = "You shall not pass.";
    error.status = 403;
    next(error);
  }
};
