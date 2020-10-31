let io;
let gameSocket;

// Called by indexjs to initalize game
exports.initGame = (sio, socket) => {
	io = sio;
	gameSocket = socket;

	gameSocket.emit("connected", { message: "User connected!" });

	// Host events
	gameSocket.on("hostCreateNewGame", hostCreateNewGame);
	gameSocket.on("hostRoomFull", hostStartGame);

	// Player events
	gameSocket.on("playerJoinGame", playerJoinGame);
	gameSocket.on("getNewQuestion", sendQuestion);
	gameSocket.on("playerAnswer", playerAnswer);
};

function sendQuestion(dataid) {
	// random question and handling done here
	// probably pick question and then add it to an array of used questions or something
	let data = getNewQuestion();
	// io.sockets.in(gameId).emit("newQuestion", data);
	console.log(data.question);
	console.log(dataid);

	if (dataid.round === 0) {
		io.sockets.in(dataid.gameId).emit("newQuestion", data);
	}
	else if (data.question) {
		//io.sockets.in(dataid.gameId).emit("newQuestion", data);
		io.to(dataid.socketId).emit("newQuestion", data);
	}
	else {
		io.sockets.in(dataid.gameId).emit("gameOver", data);
		//io.to(dataid.socketId).emit("newQuestion", data);
	}
}

function getNewQuestion() {
	let questions = [
		{
			question: "What is 2+2?",
			answer: "4",
			solution: "2+2 = 4. Refer to textbook chapter 1."
		},

		{
			question: "What is 7*8?",
			answer: "56",
			solution: "7*8 = 56. Refer to textbook chapter 2."
		},

		{
			question: "What is 10^2?",
			answer: "100",
			solution: "10^2 = 10*10 = 100. Refer to textbook chapter 2.2."
		}
	];

	let max = questions.length;
	let index = Math.floor(Math.random() * max);
	let data = questions[index];
	//questions.splice(index, 1);
	console.log(questions);

	return data;
}

function playerAnswer(data) {
	// console.log('Player ID: ' + data.playerId + ' answered a question with: ' + data.answer);
	io.to(data.playerId).emit("hostCheckAnswer", data);
}

function hostStartGame(data) {
	console.log("game started");
	data.round = 0;
	//console.log(data);
	sendQuestion(data);

	var counter = 10;
	var countdown = setInterval(function(){
	  io.sockets.emit('count', counter);
	  counter--;
	  console.log(counter);
	  if (counter === 0) {
		io.sockets.emit('gameOver', "Game Over!!");
		clearInterval(countdown);
	  }
	}, 1000);
}

function hostCreateNewGame() {
	// Create a unique Socket.IO Room
	let thisGameId = (Math.random() * 100000) | 0;

	// Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
	this.emit("newGameCreated", { gameId: thisGameId, mySocketId: this.id });

	// Join the Room and wait for the players
	this.join(thisGameId.toString());
}

function playerJoinGame(data) {
	console.log("Player " + data.playerName + " attempting to join game: " + data.gameId);

	// A reference to the player's Socket.IO socket object
	let sock = this;

	// Look up the room ID in the Socket.IO manager object.
	//console.log(gameSocket.rooms);
	let room = gameSocket.rooms;

	// If the room exists...
	if (room != undefined) {
		// attach the socket id to the data object.
		data.mySocketId = sock.id;

		// Join the room
		sock.join(data.gameId);

		console.log("Player " + data.playerName + " joining game: " + data.gameId);

		// Emit an event notifying the clients that the player has joined the room.
		io.sockets.in(data.gameId).emit("playerJoinedRoom", data);
	}
	else {
		// Otherwise, send an error message back to the player.
		this.emit("error", { message: "This room does not exist." });
	}
}
