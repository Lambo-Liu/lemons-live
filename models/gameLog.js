const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GameLog = new Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Game"
  },
  questions: [
    {
      question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Questions"
      },
      studentResponse: {
        type: String
      }
    }
  ],
  score: {
    type: Number
  },
  team: {
    type: Number
  }
});

module.exports = mongoose.model("GamesLog", GameLog);
