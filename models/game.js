const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GameSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  teams: {
    type: Number,
    required: true,
    min: 2,
    max: 4
  },
  timer: {
    type: Number,
    required: true,
    min: 60,
    max: 60 * 60
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class"
  },
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  questions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question"
    }
  ],
});

module.exports = mongoose.model("Game", GameSchema);
