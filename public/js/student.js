let socket = io();
const gameArea = document.getElementById("gameArea");

var gameId;
var classId;
var userId;
var username;

socket.on("connect", function() {
  gameId = document.getElementById("game-id").value;
  classId = document.getElementById("class-id").value;
  userId = document.getElementById("user-id").value;
  username = document.getElementById("username").value;

  socket.emit("joinRoom", gameId, classId, userId, username, function(err) {
    if (err) {
      alert(err);
      window.location.href = "/play";
    }
  });
});

socket.on("userJoined", function(username, userCount) {
  gameArea.innerHTML = document.getElementById("waiting-room-template").innerHTML;
  $("#playersWaiting").append(`<p class="text-green-400 mb-1">` + username + ` joined the game. </p>`);
  document.getElementById("userCount").innerHTML = userCount;
});

socket.on("userLeft", function(username, userCount) {
  $("#playersWaiting").append(`<p class="text-red-400 mb-1">` + username + ` left the game. </p>`);
  document.getElementById("userCount").innerHTML = userCount;
});

socket.on("firstQuestion", function(question, numTeams) {
  gameArea.innerHTML = document.getElementById("question-template").innerHTML;
  document.getElementById("question").innerHTML = question.question;
  for (let i = 0; i < numTeams; i++) {
    $("#teamScores").append(`<p> Team ${i+1}: <span id="team${i+1}Score">0</span></p>`);
  }

  document.getElementById("btnSubmitQuestion").addEventListener("click", function(e) {
    e.preventDefault();
    let userAnswer = document.getElementById("answer").value;
    socket.emit("userSubmit", question, userAnswer, userId, username);
  });
});

socket.on("questionChecked", function(isCorrect) {
  if (isCorrect === 1) {
    document.getElementById("answer").classList.add("bg-green-300");
    document.getElementById("answer").classList.remove("bg-light-dark");
  } else {
    document.getElementById("answer").classList.add("bg-red-300");
    document.getElementById("answer").classList.remove("bg-light-dark");
  }

  document.getElementById("btnSubmitQuestion").remove();
  $("#nextQuestion").append(`<button id="btnNextQuestion" type="button" class="mb-3 ml-2 font-semibold bg-theme4 hover:bg-theme3 text-dark border-b-2 rounded py-2 px-4 border-dark shadow">Next</button>`);

  document.getElementById("btnNextQuestion").addEventListener("click", function(e) {
    e.preventDefault();
    socket.emit("nextQuestion", userId);
  });
});

socket.on("showNextQuestion", function(question, numTeams) {
  document.getElementById("btnNextQuestion").remove();
  $("#nextQuestion").append(`<button id="btnSubmitQuestion" type="button" class="mb-3 ml-2 font-semibold bg-theme4 hover:bg-theme3 text-dark border-b-2 rounded py-2 px-4 border-dark shadow">Submit</button>`);
  document.getElementById("answer").value = "";
  document.getElementById("answer").classList.remove("bg-green-300");
  document.getElementById("answer").classList.remove("bg-red-300");
  document.getElementById("answer").classList.add("bg-light-dark");
  document.getElementById("question").innerHTML = question.question;

  document.getElementById("btnSubmitQuestion").addEventListener("click", function(e) {
    e.preventDefault();
    let userAnswer = document.getElementById("answer").value;
    socket.emit("userSubmit", question, userAnswer, userId, username);
  });
});

socket.on("updateProgress", function(isCorrect, team, username, question, userAnswer) {
  console.log("updating progress");
  let score = document.getElementById("team"+team+"Score");

  if (isCorrect === 1) {
    score.innerHTML = Number(score.innerHTML) + 100;
  } else {
    score.innerHTML = Number(score.innerHTML) - 20;
  }
});

socket.on("teamFinished", function() {
  gameArea.innerHTML = document.getElementById("finish-template").innerHTML;

  socket.emit("waitingGameOver")
});

socket.on("gameOver", function(team) {
  gameArea.innerHTML = document.getElementById("team-win-template").innerHTML;
  document.getElementById("first-team").innerHTML = "Team " + team;
});
