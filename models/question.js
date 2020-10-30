const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const QuestionsSchema = new Schema({
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  solution: {
    type: String
  },
  hint: {
    type: String
  }
});

module.exports = mongoose.model("Question", QuestionsSchema);
