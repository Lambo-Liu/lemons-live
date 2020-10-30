jQuery(
	(function($) {
		"use strict";

		/********************
		***    IO CODE    ***
		*********************/
		let IO = {
			init: function() {
				IO.socket = io.connect();
				IO.bindEvents();
			},

			// THESE EVENTS ARE CALLED FROM GAME.JS
			bindEvents: function() {
				IO.socket.on("connected", IO.onConnected);
				IO.socket.on("newGameCreated", IO.onNewGameCreated);
				IO.socket.on("playerJoinedRoom", IO.playerJoinedRoom);
				IO.socket.on("startGame", IO.startGame);
				IO.socket.on("newQuestion", IO.onNewQuestion);

				IO.socket.on("error", IO.error);
			},

			onConnected: function(data) {
				console.log(data.message);
				//console.log(IO.socket.id);
				App.mySocketId = IO.socket.id;
			},

			onNewGameCreated: function(data) {
				//console.log(data);
				App.Host.gameInit(data);
			},

			playerJoinedRoom: function(data) {
				// When a player joins a room, do the updateWaitingScreen funciton.
				// There are two versions of this function: one for the 'host' and
				// another for the 'player'.
				//
				// So on the 'host' browser window, the App.Host.updateWiatingScreen function is called.
				// And on the player's browser, App.Player.updateWaitingScreen is called.
				App[App.myRole].updateWaitingScreen(data);
			},

			startGame: function(data) {
				//this line from template giver error in console. u can look at it if u want
				//App[App.myRole].gameCountdown(data);
				console.log("starting game");
				IO.socket.emit("getQuestion");
			},

			onNewQuestion: function(data) {
				App[App.myRole].newQuestion(data);
			},

			error: function(data) {
				alert(data.message);
			}
		};

		/********************
		***    APP CODE   ***
		*********************/
		let App = {
			gameId: 0,
			myRole: "", //student or teacher
			mySocketId: "",
			currentRound: 0,

			init: function() {
				App.cacheElements();
				App.showInitScreen();
				App.bindEvents();
			},

			cacheElements: function() {
				App.$doc = $(document);

				// Templates
				App.$gameArea = $("#gameArea");
				App.$templateIntroScreen = $("#intro-screen-template").html();
				App.$templateNewGame = $("#create-game-template").html();
				App.$templateJoinGame = $("#join-game-template").html();
				App.$hostGame = $("#host-game-template").html();
			},

			// THESE EVENTS ARE CALLED FROM HTML INTERACTION
			bindEvents: function() {
				// Host
				App.$doc.on("click", "#btnCreateGame", App.Host.onCreateClick);
				App.$doc.on("click", "#btnHostStart", App.Host.onStartClick);

				// Player
				App.$doc.on("click", "#btnJoinGame", App.Player.onJoinClick);
				App.$doc.on("click", "#btnPlayerJoin", App.Player.onPlayerJoinClick);
				App.$doc.on("click", "#submitAnswer", App.Player.getNewQuestion);
			},

			showInitScreen: function() {
				App.$gameArea.html(App.$templateIntroScreen);
			},

			/********************
			***   HOST CODE   ***
			*********************/
			Host: {
				players: [],
				isNewGame: false,
				numPlayersInRoom: 0,
				currentCorrectAnswer: "",

				onCreateClick: function() {
					console.log("Clicked Create New Game");
					IO.socket.emit("hostCreateNewGame");
				},

				gameInit: function(data) {
					App.gameId = data.gameId;
					App.mySocketId = data.mySocketId;
					App.myRole = "Host";
					App.Host.numPlayersInRoom = 0;

					App.Host.displayNewGameScreen();
					console.log("Game started with ID: " + App.gameId + " by host: " + App.mySocketId);
				},

				displayNewGameScreen: function() {
					App.$gameArea.html(App.$templateNewGame);
					$("#gameURL").text(window.location.href);
					$("#spanNewGameCode").text(App.gameId);
				},

				updateWaitingScreen: function(data) {
					// If this is a restarted game, show the screen.
					if (App.Host.isNewGame) {
						App.Host.displayNewGameScreen();
					}
					// Update host screen
					$("#playersWaiting").append("<p/>").text("Player " + data.playerName + " joined the game.");

					// Store the new player's data on the Host.
					App.Host.players.push(data);

					// Increment the number of players in the room
					App.Host.numPlayersInRoom += 1;
					console.log(App.Host.numPlayersInRoom);
					// If two players have joined, start the game!
					if (App.Host.numPlayersInRoom === 2) {
						// console.log('Room is full. Almost ready!');

						// Let the server know that two players are present.
						IO.socket.emit("hostRoomFull", { gameId: App.gameId, socketId: App.mySocketId });
					}
				},

				onStartClick: function() {
					IO.socket.emit("hostRoomFull", App.gameId);
				},

				gameCountdown: function() {
					// Prepare the game screen with new HTML
					App.$gameArea.html(App.$hostGame);

					// Begin the on-screen countdown timer
					let $secondsLeft = $("#hostWord");
					App.countDown($secondsLeft, 5, function() {
						IO.socket.emit("hostCountdownFinished", App.gameId);
					});

					// Display the players' names on screen
					$("#player1Score.playerName").html(App.Host.players[0].playerName);
					$("#player2Score.playerName").html(App.Host.players[1].playerName);

					// Set the Score section on screen to 0 for each player.
					$("#player1Score").find(".score").attr("id", App.Host.players[0].mySocketId);
					$("#player2Score").find(".score").attr("id", App.Host.players[1].mySocketId);
				},

				newQuestion: function(data) {
					App.$gameArea.html(App.$hostGame);
					// Update the data for the current round
					// App.Host.currentCorrectAnswer = data.answer;
					// App.Host.currentRound = data.round;
				}
			},

			/********************
			***  PLAYER CODE  ***
			*********************/
			Player: {
				hostSocketId: "",
				myName: "",

				onJoinClick: function() {
					// console.log('Clicked "Join A Game"');
					// Display the Join Game HTML on the player's screen.
					App.$gameArea.html(App.$templateJoinGame);
					// console.log(IO.socket.manager);
				},

				onPlayerJoinClick: function() {
					console.log('Player clicked "Join"');

					// collect data to send to the server
					let data = {
						gameId: +$("#inputGameId").val(),
						playerName: $("#inputPlayerName").val() || "anon"
					};

					// Send the gameId and playerName to the server
					IO.socket.emit("playerJoinGame", data);

					// Set the appropriate properties for the current player.
					App.myRole = "Player";
					App.Player.myName = data.playerName;
				},

				updateWaitingScreen: function(data) {
					if (IO.socket.id === data.mySocketId) {
						App.myRole = "Player";
						App.gameId = data.gameId;

						$("#playerWaitingMessage")
							.append("<p/>")
							.text("Joined Game " + data.gameId + ". Please wait for game to begin.");
					}
				},

				gameCountdown: function(hostData) {
					App.Player.hostSocketId = hostData.mySocketId;
					$("#gameArea").html('<div class="gameOver">Get Ready!</div>');
				},

				newQuestion: function(data) {
					$("#gameArea").html(App.$hostGame);
					// Insert the new word into the DOM
					$("#question").text(data.question);

					// Update the data for the current round
					// App.Host.currentCorrectAnswer = data.answer;
					// App.Host.currentRound = data.round;
				},

				getNewQuestion: function() {
					IO.socket.emit("getNewQuestion", { gameId: App.gameId, socketId: App.mySocketId });
				}
			},

			/********************
			***  UTILITY CODE  ***
			*********************/
			countDown: function($el, startTime, callback) {
				// Display the starting time on the screen.
				$el.text(startTime);
				// console.log('Starting Countdown...');

				// Start a 1 second timer
				var timer = setInterval(countItDown, 1000);

				// Decrement the displayed timer value on each 'tick'
				function countItDown() {
					startTime -= 1;
					$el.text(startTime);

					if (startTime <= 0) {
						// console.log('Countdown Finished.');

						// Stop the timer and do the callback.
						clearInterval(timer);
						callback();
						return;
					}
				}
			}
		};
		IO.init();
		App.init();
	})($)
);
