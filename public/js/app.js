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
			},

			// THESE EVENTS ARE CALLED FROM HTML INTERACTION
			bindEvents: function() {
				// Host
				App.$doc.on("click", "#btnCreateGame", App.Host.onCreateClick);

				// Player
				App.$doc.on("click", "#btnJoinGame", App.Player.onJoinClick);
				App.$doc.on("click", "#btnPlayerJoin", App.Player.onPlayerJoinClick);
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
						IO.socket.emit("hostRoomFull", App.gameId);
					}
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
					console.log(IO.socket.manager);
				},

				onPlayerJoinClick: function() {
					console.log('Player clicked "Join"');

					// collect data to send to the server
					var data = {
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
				}
			}
		};
		IO.init();
		App.init();
	})($)
);
