let socket = io();
const gameArea = document.getElementById("gameArea");

var gameId;
var classId;
var userId;

socket.on("connect", function() {
  gameId = document.getElementById("game-id").value;
  classId = document.getElementById("class-id").value;
  userId = document.getElementById("user-id").value;

  socket.emit("openRoom", gameId, classId, userId, function(err) {
    if (err) {
      alert(err);
      window.location.href = "/dashboard";
    }
  });
});

socket.on("roomCreated", function(userId) {
  gameArea.innerHTML = document.getElementById("waiting-room-template").innerHTML;

  document.getElementById("btnHostStart").addEventListener("click", function(e) {
    e.preventDefault();
    // change teacher page to track team progress waiting on lambert to make template
    //gameArea.innerHTML = document.getElementById("host-game-template").innerHTML;
    socket.emit("startGame", gameId);
  });
});

socket.on("userJoined", function(username, userCount) {
  $("#playersWaiting").append(`<p class="text-green-400 mb-1">` + username + ` joined the game. </p>`);
  document.getElementById("userCount").innerHTML = userCount;
});

socket.on("userLeft", function(username, userCount) {
  $("#playersWaiting").append(`<p class="text-red-400 mb-1">` + username + ` left the game. </p>`);
  document.getElementById("userCount").innerHTML = userCount;
});

socket.on("showProgress", function(numTeams) {
  gameArea.innerHTML = document.getElementById("host-game-template").innerHTML;
  for (let i = 0; i < numTeams; i++) {
    $("#teamScores").append(`<p> Team ${i+1}: <span id="team${i+1}Score">0</span></p>`);
  }
});

socket.on("updateProgress", function(isCorrect, team, username, question, userAnswer) {
  let score = document.getElementById("team"+team+"Score");

  if (isCorrect === 1) {
    score.innerHTML = Number(score.innerHTML) + 100;
    $("#gameLog").append(`<p class="text-green-400 mb-1"> ${username} (Team ${team}) got the question ${question} correct (student's response: ${userAnswer}). </p>`);
  } else {
    score.innerHTML = Number(score.innerHTML) - 20;
    $("#gameLog").append(`<p class="text-red-400 mb-1"> ${username} (Team ${team}) got the question ${question} incorrect (student's response: ${userAnswer}). </p>`);
  }
});

socket.on("teamFinished", function(team) {
  $("#gameLog").append(`<p class="text-teal-400 mb-1"> Team ${team} finished! </p>`);
});
