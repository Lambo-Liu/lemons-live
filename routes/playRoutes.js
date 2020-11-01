const express = require("express");
const router = express.Router();
const middleware = require("../middleware");
const { isLoggedIn, isStudent } = middleware;

const Class = require("../models/class");
const Game = require("../models/game");
const GameLog = require("../models/gameLog");

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
      GameLog.find({student: req.user}, function(err, gamelog) {
        if (err) {
          console.log(err);
        } else {
          console.log(gamelog)
          res.render("play/home", {classes, user: req.user, gamelog});
        }
      });
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
	Class.findOne({_id: req.params.id}, function(err, foundClass) {
    if (err) {
      req.flash("error", "An error has occured! Please contact a site admin if you believe this was a mistake.");
      res.redirect("/dashboard");
    } else {
      Game.findOne({_id: req.params.gameid}, function(err, game) {
        if (err) {
          req.flash("error", "An error has occured! Please contact a site admin if you believe this was a mistake.");
          res.redirect("/dashboard");
        } else {
          res.render("play/games/show", {user: req.user, foundClass, gameID: game._id});
        }
      });
    }
  });
});

module.exports = router;
