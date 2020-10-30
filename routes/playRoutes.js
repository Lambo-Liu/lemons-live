const express = require("express");
const router = express.Router();
const middleware = require("../middleware");
const { isLoggedIn, isStudent } = middleware;

const Class = require("../models/class");

// makes logout button work
const users = require("../controllers/users");
router.get("/logout", users.logout)

router.get("/", function(req, res) {
	// check if user is in class before displaying it. that can be done through this param once the
	// forms are setup to add students so it can be tested
	Class.find({}, function(err, classes) {
		if (err) {
			console.log(err);
		} else {
			res.render("play/home", {classes, user: req.user});
		}
	})
});

router.get("/:id", function(req, res) {
	// add student param here once ready
  Class.findOne({_id: req.params.id}, function(err, foundClass) {
      if (err) {
          console.log(err);
      } else {
          res.render("play/classes/show", {foundClass, user: req.user});
      }
  });
});

router.get("/:id/:gameid", function(req, res) {
  res.render("play/games/show", {user: req.user});
});

module.exports = router;
