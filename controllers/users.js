const User = require("../models/user");

function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

function validatePassword(password) {
  const re = /^(?=.*\d).{8,}$/
  return re.test(password);
}

module.exports.renderRegister = (req, res) => {
  res.render("users/register", {user: req.user});
}

module.exports.register = async (req, res, next) => {
  try {
    const { email, username, password, role } = req.body;

    if (!validateEmail(email)) {
      req.flash("error", "Your email is not in a valid format!");
      res.redirect("register");
    }

    else if (!validatePassword(password)) {
      req.flash("error", "Your password must contain at least 8 characters and a number!");
      res.redirect("register");
    }

    else if (role != "teacher" && role != "student") {
      req.flash("error", "Your account role must be of type teacher or student!");
      res.redirect("register");
    }

    else {
      let isTeacher;

      if (role === "teacher") {
        isTeacher = true;
      } else {
        isTeacher = false;
      }

      const user = new User({ email, username, isTeacher });
      const registeredUser = await User.register(user, password);
      req.login(registeredUser, err => {
        if (err) return next(err);
        if (isTeacher === true) {
          req.flash("success", "Welcome to Lemons Live!");
          res.redirect("/dashboard");
        }
        else {
          req.flash("success", "Welcome to Lemons Live!");
          res.redirect("/play");
        }
      });
    }
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("register");
  }
}

module.exports.renderLogin = (req, res) => {
  res.render("users/login", {user: req.user});
}

module.exports.login = async (req, res) => {
  if (req.user.isTeacher === true) {
    req.flash("success", "Welcome back to Lemons Live!");
    res.redirect("/dashboard");
  }
  else {
    req.flash("success", "Welcome back to Lemons Live!");
    res.redirect("/play");
  }
}

module.exports.logout = (req, res) => {
  if (req.user === undefined || req.user === null) {
    res.redirect("/login");
  }

  else {
    req.logout();
    //req.session.destroy();
    req.flash("success", "You have successfully signed out of your account!");
    res.redirect("/");
  }
}
