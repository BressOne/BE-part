let mongoose = require("mongoose");
// let crypto = require("crypto");
let passportLocalMongoose = require("passport-local-mongoose");

let UserSchema = new mongoose.Schema({
  // username: String,
  // password: String
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  username: {
    type: String,
    unique: true,
    // required: true,
    trim: true
  },
  password: {
    type: String
    // required: true
  }
  // salt: {
  //   type: String,
  //   required: true
});

UserSchema.plugin(passportLocalMongoose);

// UserSchema.methods.encryptPassword = function(password) {
//   return crypto
//     .createHmac("sha1", this.salt)
//     .update(password)
//     .digest("hex");
// };

// UserSchema.virtual("password").set(function(password) {
//   (this._plainPassword = password), (this.salt = Math.random() + "");
//   this.hashedPassword = this.encryptPassword(password);
// });

// UserSchema.virtual("password").get(function() {
//   return this._plainPassword;
// });
// UserSchema.methods.checkPassword = function(password) {
//   return this.encryptPassword(password) === this.hashedPassword;
// };

module.exports = mongoose.model("User", UserSchema);
