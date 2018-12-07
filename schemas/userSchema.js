let mongoose = require("mongoose");
let crypto = require("crypto");
let UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  hashedPassword: {
    type: String,
    required: true
  },
  salt: {
    type: String,
    required: true
  }
});

UserSchema.methods.encryptPassword = function(password) {
  return crypto
    .createHmac("sha1", this.salt)
    .update(password)
    .digest("hex");
};

UserSchema.virtual("password").set(function(password) {
  (this._plainPassword = password), (this.salt = Math.random() + "");
  this.hashedPassword = this.encryptPassword(password);
});

UserSchema.virtual("password").get(function() {
  return this._plainPassword;
});
UserSchema.methods.checkPassword = function(password) {
  return this.encryptPassword(password) === this.hashedPassword;
};

UserSchema.statics.authenticate = function(username, password, callback) {
  User.findOne({ username: username }).exec(function(err, user) {
    if (err) {
      return callback(err);
    } else if (!user) {
      var err = new Error("User not found.");
      err.status = 401;
      return callback(err);
    }
    let result = user.checkPassword(password);
    if (result === true) {
      return callback(null, user);
    } else {
      return callback();
    }
  });
};

let User = mongoose.model("User", UserSchema);
module.exports = User;
