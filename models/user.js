const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

var validateEmail = function(email) {
    var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email)
};

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: [validateEmail, "Please fill a valid email address"],
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please fill a valid email address"]
  },
  isTeacher: {
    type: Boolean,
    required: true
  },
  class: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class"
    }
  ],
  questions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Questions"
    }
  ],
  gamesLog: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "GameLog"
  }],
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
