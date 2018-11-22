let express = require("express");
let app = express();
let mongoose = require("mongoose");
let bodyParser = require("body-parser");
let emailValidate = require("./modules/emailvalidate.js");
let User = require("./schemas/userSchema.js");
let cors = require("cors");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.options("*", cors());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

mongoose.connect(
  "mongodb://localhost/test",
  { useNewUrlParser: true }
);
let db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {
  console.log("we are connected to DB!");
});

app.listen(3000, function() {
  console.log("Example app listening on port 3000!");
});

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/simplehtml.html");
});

app.post("/register", cors(), function(req, res) {
  let postedForm = req.body,
    emailCorrect = false,
    passwConf = false;
  emailIsFree = false;
  passIsEmpty = true;
  console.log(req.body);
  emailValidate(postedForm.email)
    ? (emailCorrect = true)
    : (emailCorrect = false);
  postedForm.password === postedForm.passwordConf
    ? (passwConf = true)
    : (passwConf = false);
  postedForm.password === "" ? (passIsEmpty = true) : (passIsEmpty = false);

  if (emailCorrect && passwConf && !passIsEmpty) {
    let submitteduser = new User({
      email: postedForm.email,
      username: postedForm.username,
      password: postedForm.password
    });
    submitteduser.save(function(err) {
      if (err) {
        res.json({
          message: "Seems like email or username is currently in use!"
        });
      } else {
        res.json({ message: "Successfully saved!" });
      }
    });
  } else {
    let resultError = "";
    if (!emailCorrect) {
      resultError =
        resultError + "Keep yourself together! Your e-mail is incorrect\n";
    }
    if (!passwConf) {
      resultError = resultError + "Keep up! Passwords missmatch!\n";
    }
    if (passIsEmpty) {
      resultError =
        resultError + "You are easy victim! Your password is empty!\n";
    }

    res.json({ message: resultError });
  }
});

app.post("/login", function(req, res) {
  let postedForm = req.body;
  console.log(req.body);
  User.findOne({ username: postedForm.loginusername }, function(err, user) {
    console.log(user);
    if (user) {
      if (user.checkPassword(postedForm.loginpassword)) {
        res.status(200).json({
          message: "Access granted",
          loginPermission: true
        });
      } else {
        res.status(200).json({
          message: "Wrong username or pass.",
          loginPermission: false
        });
      }
    } else {
      res.status(200).json({
        message: "Wrong username or pass.",
        loginPermission: false
      });
    }
  });
});
