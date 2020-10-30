module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "You must be signed in first!");
    return res.redirect("/login");
  }
  next();
}

module.exports.isTeacher = (req, res, next) => {
  if (req.user.isTeacher === false) {
    req.flash("error", "You do not have permission to access this page!");
    return res.redirect("/play");
  }

  next();
}

module.exports.isStudent = (req, res, next) => {
  if (req.user.isTeacher === true) {
    req.flash("error", "You must use a student account to access this page!");
    return res.redirect("/dashboard");
  }

  next();
}
