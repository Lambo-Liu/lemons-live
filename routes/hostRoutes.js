const express = require("express");
const { renderRegister } = require("../controllers/users");
const router = express.Router();

const Class = require("../models/class");
const User = require("../models/user");
const Game = require("../models/game");
const Question = require("../models/question");

function returnErr(err) {
  console.log(err);
  req.flash("error", "An error has occured! Please contact a site admin if you believe this was a mistake.");
  res.redirect("/dashboard");
}

function checkDuplicateClass(userClasses, reqClass, callback) {
  let i = 0;

  if (userClasses.length === 0) {
    callback(true);
  }

  else {
    userClasses.forEach(function(eachClass, i) {
      Class.findOne({_id: eachClass}, function(err, foundClass) {
        if (err) {
          returnErr(err);
        }
        else {
          if (reqClass.toLowerCase() === foundClass.title.toLowerCase()) {
            callback(false);
          }
          else {
            i++;
            if (userClasses.length === i) {
              callback(true);
            }
          }
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
      name: student.username,
      id: student._id
    }
    studentsParsed.push(studentParsed);
  });

  return studentsParsed;
}

function parseQuestions(questions, callback) {
  var questionsParsed = new Array();

  if (questions.length === 0) {
    callback(undefined);
  }

  else {
    let i = 0;

    questions.forEach(function(question, i) {
      Question.findOne({_id: question}, function(err, questionFound) {
        if (err) {
          returnErr(err);
        } else {
          questionsParsed.push(questionFound);
          i++;
          if (questions.length === i) {
            callback(questionsParsed);
          }
        }
      });
    });
  }
}

function deleteQuestions(questions, callback) {
  if (questions.length === 0) {
    callback();
  }

  else {
    let i = 0;

    questions.forEach(function(question, i) {
      Question.deleteOne({_id: question}, function(err, deletedQuestion) {
        if (err) {
          returnErr(err);
        } else {
          i++;
          if (questions.length === i) {
            callback();
          }
        }
      });
    });
  }
}

router.get("/", function(req, res) {
  Class.find({}, function(err, classes) {
    if (err) {
      returnErr(err);
    } else {
      res.render("host/dashboard", {classes, user: req.user});
    }
  });
});

router.get("/new", function(req, res) {
  res.render("host/classes/new", {user: req.user});
});

router.post("/", function(req, res) {
  var newClass = {
    title: req.body.className,
    teacher: req.user._id
  };

  if (req.user.isTeacher === true) {
    let isValid;
    checkDuplicateClass(req.user.class, req.body.className, function(classNameNoDuplicate) {
      if (!classNameNoDuplicate) {
        isValid = false;
      } else {
        isValid = true;
      }

      if (isValid) {
        Class.create(newClass, function(err, createdClass) {
          if (err) {
            returnErr(err);
          } else {
            User.findOneAndUpdate({_id: req.user._id}, {$push: {class: createdClass._id}}, function(err, updatedUser) {
              if (err) {
                returnErr(err);
              } else {
                req.flash("success", "Class Created");
                res.redirect("/dashboard");
              }
            });
          }
        });
      } else {
        req.flash("error", "This class name already exists!");
        res.redirect("/dashboard");
      }
    });
  }

  else {
    req.flash("error", "You must use a teacher account to create a class!");
    res.redirect("/play");
  }
});

router.get("/:id", function(req, res) {
  Class.findOne({_id: req.params.id}, function(err, foundClass) {
    if (err) {
      returnErr(err);
    } else {
      User.find({isTeacher: false, class: { $ne: foundClass._id } }, function(err, studentsNotInClass) {
        if (err) {
          returnErr(err);
        } else {
          User.find({isTeacher: false, class: foundClass._id}, function(err, studentsInClass) {
            if (err) {
              returnErr(err);
            } else {
              User.findOne({_id: foundClass.teacher}, function(err, teacher) {
                if (err) {
                  returnErr(err);
                } else {
                  Game.find({class: foundClass._id}, function(err, games) {
                    if (err) {
                      returnErr(err);
                    } else {
                      res.render("host/classes/show", {
                        foundClass,
                        studentsNotInClass: parseUsers(studentsNotInClass),
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
    }
  });
});

router.get("/:id/edit", function(req, res) {
  Class.findOne({_id: req.params.id}, function(err, foundClass) {
    if (err) {
      returnErr(err);
    } else {
      res.render("host/classes/edit", {foundClass, user: req.user});
    }
  });
});

router.put("/:id", function(req, res) {
  Class.findOne({_id: req.params.id}, function(err, foundClass) {
    if (foundClass.teacher.toString() != req.user._id.toString()) {
      req.flash("error", "You do not have permission to delete this class!");
      res.redirect("/dashboard");
    } else {
      var editClass = {
        title: req.body.className,
      };

      Class.findOneAndUpdate({ _id: req.params.id }, editClass, function(err, updatedClass) {
        if (err) {
          returnErr(err);
        } else {
          req.flash("success", "Class updated!");
          res.redirect("/dashboard");
        }
      });
    }
  });
});

router.delete("/:id", function(req, res) {
  Class.findOne({_id: req.params.id}, function(err, foundClass) {
    if (foundClass.teacher.toString() != req.user._id.toString()) {
      req.flash("error", "You do not have permission to delete this class!");
      res.redirect("/dashboard");
    } else {
      Class.deleteOne({_id: req.params.id}, function(err, deletedClass) {
        if (err) {
          returnErr(err);
        } else {
          User.updateMany({class: req.params.id}, {$pull: {class: req.params.id}}, function(err, updatedUser) {
            if (err) {
              returnErr(err);
            } else {
              req.flash("success", "Successfully deleted class " + deletedClass.title);
              res.redirect("/dashboard/");
            }
          });
        }
      });
    }
  });
});

router.put("/:id/add-student", function(req, res) {
  Class.findOne({_id: req.params.id}, function(err, foundClass) {
    if (foundClass.teacher.toString() != req.user._id.toString()) {
      req.flash("error", "You do not have permission to delete this class!");
      res.redirect("/dashboard");
    } else {
      if (Array.isArray(req.body.addedStudents)) {
        req.body.addedStudents.forEach(function(student) {
          // FUTURE: CHECK THAT THE STUDENT IS NOT ALREADY IN THE CLASS
          User.findOneAndUpdate({_id: student}, {$push: {class: req.params.id}}, function(err, updatedStudent) {
            if (err) {
              returnErr(err);
            }
          });
        });

        Class.findOneAndUpdate({_id: req.params.id}, {$push: {students: {$each: req.body.addedStudents}}}, function(err, updatedClass) {
          if (err) {
            returnErr(err);
          } else {
            req.flash("success", "Successfully added students to the classroom!");
            res.redirect("/dashboard");
          }
        });
      }

      else {
        // FUTURE: CHECK THAT THE STUDENT IS NOT ALREADY IN THE CLASS
        User.findOneAndUpdate({_id: req.body.addedStudents}, {$push: {class: req.params.id}}, function(err, updatedStudent) {
          if (err) {
            returnErr(err);
          } else {
            Class.findOneAndUpdate({_id: req.params.id}, {$push: {students: req.body.addedStudents}}, function(err, updatedClass) {
              if (err) {
                returnErr(err);
              } else {
                req.flash("success", "Successfully added students to the classroom!");
                res.redirect("/dashboard");
              }
            });
          }
        });
      }
    }
  });
});

router.get("/:id/new-game", function(req, res) {
  Class.findOne({_id: req.params.id}, function(err, foundClass) {
    if (err) {
      returnErr(err);
    } else {
      res.render("host/games/new", {foundClass, user: req.user});
    }
  });
});

router.post("/:id", function(req, res) {
  var newGame = {
    title: req.body.title,
    teams: req.body.teams,
    timer: req.body.timer,
    class: req.params.id,
  };

  questions = JSON.parse(req.body.questions);

  Game.create(newGame, function(err, createdGame) {
    if (err) {
      returnErr(err);
    } else {
      Class.findOneAndUpdate({_id: createdGame.class}, {$push: {games: createdGame._id}}, async function(err, updatedClass) {
        if (err) {
          returnErr(err);
        } else {
          await questions.forEach(function(question) {
            Question.create(question, function(err, createdQuestion) {
              if (err) {
                returnErr(err);
              } else {
                Game.findOneAndUpdate({_id: createdGame.id}, {$push: {questions: createdQuestion._id}}, function(err, updatedGame) {
                  if (err) {
                    returnErr(err);
                  }
                });
              }
            });
          });
          req.flash("success", "Game Created!");
          res.redirect("/dashboard");
        }
      });
    }
  });
});

router.delete("/:id/:gameid", function(req, res) {
  Class.findOne({_id: req.params.id}, function(err, foundClass) {
    if (foundClass.teacher.toString() != req.user._id.toString()) {
      req.flash("error", "You do not have permission to delete this class!");
      res.redirect("/dashboard");
    } else {
      Class.updateOne({_id: req.params.id}, {$pull: {games: req.params.gameid}}, function(err, updatedClass) {
        if (err) {
          returnErr(err);
        } else {
          Game.findOne({_id: req.params.gameid}, function(err, foundGame) {
            if (err) {
              returnErr(err);
            } else {
              deleteQuestions(foundGame.questions, function(err) {
                Game.deleteOne({_id: req.params.gameid}, function(err, deletedGame) {
                  if (err) {
                    returnErr(err);
                  } else {
                    req.flash("success", "Successfully deleted game " + deletedGame.title);
                    res.redirect("/dashboard/" + req.params.id);
                  }
                });
              });
            }
          });
        }
      });
    }
  });
});

router.get("/:id/:gameid", function(req, res) {
  Class.findOne({_id: req.params.id}, function(err, foundClassd) {
    if (err) {
      returnErr(err);
    } else {
      Game.findOne({_id: req.params.gameid}, function(err, game) {
        if (err) {
          returnErr(err);
        } else {
          parseQuestions(game.questions, function(parsedQuestions) {
            console.log("q " + parsedQuestions);
            res.render("host/games/show", {user: req.user, game, questions: parsedQuestions});
          });
        }
      });
    }
  });
});

router.get('*', function(req, res){
  res.send('404 error', 404);
});

module.exports = router;
