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

socket.on("firstQuestion", function(question) {
  gameArea.innerHTML = document.getElementById("question-template").innerHTML;
  document.getElementById("question").innerHTML = question.question;

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

socket.on("showNextQuestion", function(question) {
  gameArea.innerHTML = document.getElementById("question-template").innerHTML;
  document.getElementById("question").innerHTML = question.question;

  document.getElementById("btnSubmitQuestion").addEventListener("click", function(e) {
    e.preventDefault();
    let userAnswer = document.getElementById("answer").value;
    socket.emit("userSubmit", question, userAnswer, userId, username);
  });
});

socket.on("teamFinished", function() {
  gameArea.innerHTML = document.getElementById("finish-template").innerHTML;

  socket.emit("waitingGameOver")
});

socket.on("gameOver", function() {
  gameArea.innerHTML = document.getElementById("team-win-template").innerHTML;
  //first-team
});
