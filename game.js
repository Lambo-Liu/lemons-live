let io;
let gameSocket;

// Called by indexjs to initalize game
exports.initGame = (sio, socket) => {
	io = sio;
	gameSocket = socket;

	gameSocket.emit("connected", { message: "User connected!" });

	// Host events
	gameSocket.on("hostCreateNewGame", hostCreateNewGame);
	gameSocket.on("playerJoinGame", playerJoinGame);
};

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
	console.log(gameSocket.rooms);
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
