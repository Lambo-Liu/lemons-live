var io;
var socket;
const User = require("./models/user");
const Game = require("./models/game");
const Class = require("./models/class");
const Question = require("./models/question");
const GameLog = require("./models/gameLog");

var hostId;
var players = new Array();
var numTeams;
var timer;
var questions;
var teams = new Array();
var teamProgress = new Array();
var teamPoints = new Array();

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

// Called by app.js to initalize game
exports.initGame = (io, socket) => {
	io = io;
	socket = socket;

  socket.on('disconnect', function () {
    const index = players.indexOf(socket.userId);
    if (index > -1) {
      players.splice(index, 1);
    }
    io.to(socket.room).emit("userLeft", socket.username, io.engine.clientsCount);
  });

	// Host events
	socket.on("openRoom", function(roomId, classId, userId, callback) {
    // TODO: check if the teacher is the owner of class
    Class.countDocuments({_id: classId}, function(err, count) {
      if (count <= 0) {
        return callback("This class does not exist!");
      } else {
        Class.findOne({games: roomId}, function(err, classFound) {
          if (classFound._id != classId) {
            return callback("Invalid class code or game code!");
          } else {
            socket.join(roomId);
            socket.join(userId);
            hostId = userId;
            io.to(roomId).emit("roomCreated", userId);
          }
        });
      }
    });
  });

  socket.on("joinRoom", function(roomId, classId, userId, username, callback) {
    User.findOne({_id: userId}, function(err, foundUser) {
      if (!(foundUser.class.includes(classId))) {
        return callback("You must be in the class to participate in this event!")
      } else {
        socket.join(roomId);
        socket.join(userId);
        socket.room = roomId;
        socket.username = username;
        socket.userId = userId;
        players.push(userId);
        io.to(roomId).emit("userJoined", username, io.engine.clientsCount);
      }
    });
  });

	socket.on("startGame", function(roomId) {
    Game.findOneAndUpdate({_id: roomId}, {students: players}, function(err, updatedGame) {
      numTeams = updatedGame.teams;
      timer = updatedGame.timer;
      questions = updatedGame.questions;

      shuffle(players);

			// Initialize 2d array of teams
      for (let k = 0; k < numTeams; k++) {
        teams.push([]);
        teamPoints.push(0)
        teamProgress[k] = 0;
      }
			// Set teams
      let j = 0;
      for (let i = 0; i < players.length; i++) {
        if (j === numTeams) {
          j = 0;
        }
        teams[j].push(players[i]);
        j++;
      }

			for (let j = 0; j < teams[0].length; j++) {
        Question.findOne({_id: questions[j]}, function(err, foundQuestion) {
          for (let i = 0; i < teams.length; i++) {
            teamProgress[i] = j;
            if (teams[i][j] != null) {
              let gameLogObj = {
                student: teams[i][j],
                game: roomId,
                team: (i+1),
                score: 0
              }
              GameLog.create(gameLogObj, function(err, newGameLog) {
                User.findOneAndUpdate({_id: teams[i][j]}, {$push: {gamesLog: newGameLog._id}}, function(err, updatedUser) {
                  io.to(teams[i][j]).emit("firstQuestion", foundQuestion, numTeams);
    							io.to(hostId).emit("showProgress", numTeams);
                });
              });
              // console.log("Team " + (i+1) + " player " + (j+1) + " gets the question " + foundQuestion.question);
            }
          }
        });
			}
    });
  });

	socket.on("userSubmit", function(question, userAnswer, userId, username) {
    User.findOne({_id: userId}, function(err, foundUser) {
      GameLog.findOne({student: userId, game: socket.room}, function(err, foundGameLog) {
        let questionObj = {
          question: question._id,
          studentResponse: userAnswer
        };

        if (userAnswer === question.answer) {
          GameLog.findOneAndUpdate({student: userId, game: socket.room}, {$inc: {score: 100}, $push: {questions: questionObj}}, function(err, updatedGameLog) {
            teamPoints[foundGameLog.team-1] += 100;
            io.to(userId).emit("questionChecked", 1);
            io.to(socket.room).emit("updateProgress", 1, foundGameLog.team, username, question.question, userAnswer);
          });
        } else {
          GameLog.findOneAndUpdate({student: userId, game: socket.room}, {$inc: {score: -20}, $push: {questions: questionObj}}, function(err, updatedGameLog) {
            teamPoints[foundGameLog.team-1] -= 20;
            io.to(userId).emit("questionChecked", 0);
            io.to(socket.room).emit("updateProgress", 0, foundGameLog.team, username, question.question, userAnswer);
          });
        }
      });
    });
	});

	socket.on("nextQuestion", function(userId) {
    GameLog.findOne({student: userId, game: socket.room}, function(err, foundGameLog) {
      teamProgress[foundGameLog.team-1]++;

      if (teamProgress[foundGameLog.team-1] >= questions.length) {
        console.log("end game");
        io.to(userId).emit("teamFinished");
        io.to(hostId).emit("teamFinished", foundGameLog.team);
      } else {
        Question.findOne({_id: questions[teamProgress[foundGameLog.team-1]]}, function(err, foundQuestion) {
          console.log(foundQuestion);
          io.to(userId).emit("showNextQuestion", foundQuestion, numTeams);
        });
      }
    });
	});

  socket.on("waitingGameOver", function() {
    let ctr = 0;
    for (let i = 0; i < teamProgress.length; i++) {
      if (teamProgress[i] === questions.length) {
        ctr++;
      }
    }

    let max = 0;
    let team = 0;

    console.log(teamPoints);
    if (ctr === teamProgress.length) {
      for (let i = 0; i < teamPoints.length; i++) {
        if (teamPoints[i] > max) {
          max = teamPoints[i];
          team = i;
        }
      }
      io.to(socket.room).emit("gameOver", team+1);
    }
  });
};
