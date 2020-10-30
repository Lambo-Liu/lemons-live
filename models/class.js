const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ClassSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  games: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game"
    }
  ],
});

module.exports = mongoose.model("Class", ClassSchema);
