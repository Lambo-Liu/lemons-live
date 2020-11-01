const express = require("express");
const router = express.Router();
const middleware = require("../middleware");
const { isLoggedIn, isStudent } = middleware;

const Class = require("../models/class");
const User = require("../models/user");
const Game = require("../models/game");
const GameLog = require("../models/gameLog");
const Question = require("../models/question");

function parseGamesLog(gamesLog, callback) {
  var gamesLogParsed = new Array();

  if (gamesLog.length === 0) {
    callback(undefined);
  }

  else {
    let i = 0;

    gamesLog.forEach(function(gameLog, i) {
      Game.findOne({_id: gameLog.game}, function(err, gameFound) {
        if (err) {
          req.flash("error", "An error has occured! Please contact a site admin if you believe this was a mistake.");
          res.redirect("/dashboard");
        } else {
					Class.findOne({_id: gameFound.class}, function(err, classFound) {
						let gameLogWithClass = {
							gameName: gameFound.title,
							className: classFound.title,
							gameLog: gameLog
						}
	          gamesLogParsed.push(gameLogWithClass);
	          i++;
	          if (gamesLog.length === i) {
	            callback(gamesLogParsed);
	          }
					});
        }
      });
    });
  }
}

function parseUsers(students) {
  var studentsParsed = new Array();

  students.forEach(function(student) {
    let studentParsed = {
      email: student.email,
      username: student.username,
      id: student._id
    }
    studentsParsed.push(studentParsed);
  });

  return studentsParsed;
}

function parseQuestions(gameLogFound, gameFound, classFound, callback) {
	if (gameLogFound.questions.length === 0) {
		let gamesLogObj = {
			id: gameLogFound._id,
			questions: [],
			score: gameLogFound.score,
			team: gameLogFound.team,
			gameName: gameFound.title,
		}
		callback(gamesLogObj);
	}

	else {
		var questions = new Array();
		let i = 0;

		console.log(gameLogFound.questions);

		gameLogFound.questions.forEach(function (question) {
			Question.findOne({_id: question.question}, function(err, questionFound) {
				let questionObj = {
					question: questionFound.question,
					answer: questionFound.answer,
					solution: questionFound.solution,
					studentResponse: question.studentResponse
				}
				questions.push(questionObj);
				i++
				if (gameLogFound.questions.length === i) {
					let gamesLogObj = {
						id: gameLogFound._id,
						questions: questions,
						score: gameLogFound.score,
						team: gameLogFound.team,
						gameName: gameFound.title,
					}

					console.log(gamesLogObj);

					callback(gamesLogObj);
				}
			});
		});
	}
}


router.get("/", function(req, res) {
	// check if user is in class before displaying it. that can be done through this param once the
	// forms are setup to add students so it can be tested
	Class.find({students: req.user}, function(err, classes) {
		if (err) {
			console.log(err);
		} else {
      GameLog.find({student: req.user}, function(err, gamesLog) {
        if (err) {
          console.log(err);
        } else {
					parseGamesLog(gamesLog, function(gamesLogParsed) {
						res.render("play/home", {classes, user: req.user, gamesLog: gamesLogParsed});
					});
        }
      });
		}
	})
});

router.get("/:id", function(req, res) {
  Class.findOne({_id: req.params.id}, function(err, foundClass) {
    if (err) {
      req.flash("error", "An error has occured! Please contact a site admin if you believe this was a mistake.");
      res.redirect("/dashboard");
    } else {
      User.find({isTeacher: false, class: foundClass._id}, function(err, studentsInClass) {
        if (err) {
          req.flash("error", "An error has occured! Please contact a site admin if you believe this was a mistake.");
          res.redirect("/dashboard");
        } else {
          User.findOne({_id: foundClass.teacher}, function(err, teacher) {
            if (err) {
              req.flash("error", "An error has occured! Please contact a site admin if you believe this was a mistake.");
              res.redirect("/dashboard");
            } else {
              Game.find({class: foundClass._id}, function(err, games) {
                if (err) {
                  req.flash("error", "An error has occured! Please contact a site admin if you believe this was a mistake.");
                  res.redirect("/dashboard");
                } else {
                  res.render("play/classes/show", {
                    foundClass,
                    studentsInClass: parseUsers(studentsInClass),
                    teacher,
                    games,
                    user: req.user
                  });
                }
              });
            }
          });
        }
      });
    }
  });
});

router.get("/analyze/:logid", function(req, res) {
	GameLog.findOne({_id: req.params.logid}, function(err, gameLogFound) {
		Game.findOne({_id: gameLogFound.game}, function(err, gameFound) {
			if (err) {
				req.flash("error", "An error has occured! Please contact a site admin if you believe this was a mistake.");
				res.redirect("/dashboard");
			} else {
				Class.findOne({_id: gameFound.class}, function(err, classFound) {
					parseQuestions(gameLogFound, gameFound, classFound, function(gameLogObj) {
						res.render("play/games/analyze", {user: req.user, gameLog: gameLogObj});
					});
				});
			}
		});
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
