let mongoose = require("mongoose");

let DialogueSchema = new mongoose.Schema({
  userIDs: {
    first: { type: String, required: true },
    second: { type: String, required: true }
  },
  messages: [
    {
      senderID: { type: String, required: true },
      content: { type: String, required: true },
      dateTime: Date,
      required: false
    }
  ]
});

let Dialogue = mongoose.model("Dialogue", DialogueSchema);
module.exports = Dialogue;
