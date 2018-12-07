let bodyParser = require("body-parser");
let emailValidate = require("../modules/emailvalidate.js");

let express = require("express");
let router = express.Router();
let User = require("../schemas/userSchema.js");
let cors = require("cors");
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

let corsOptions = {
  origin: true,
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: true,
  optionsSuccessStatus: 204
};
router.use(cors(corsOptions));
router.options("*", cors(corsOptions));

router.post("/register", function(req, res) {
  console.log(req.body);
  let postedForm = req.body,
    emailCorrect = false,
    passwConf = false;
  emailIsFree = false;
  passIsEmpty = true;
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
        res.json({ message: "Successfully saved! Go to log in" });
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

router.post("/login", function(req, res) {
  console.log(req.body);
  let postedForm = req.body;
  User.authenticate(postedForm.username, postedForm.password, function(
    error,
    user
  ) {
    if (error || !user) {
      res.status(200).json({
        message: "Wrong username or pass.",
        loginPermission: false
      });
    } else {
      console.log(user._id);
      req.session.userId = user._id;
      console.log(req);
      res.status(200).json({
        message: "Access granted",
        loginPermission: true
      });
    }
  });
});

router.post("/search_person", function(req, res) {
  console.log(req);
  console.log(req.body.searchValue);
  const pattern = req.body.searchValue;
  console.log(pattern);
  User.find({ username: { $regex: `${pattern}`, $options: "i" } }, function(
    err,
    users
  ) {
    console.log(users);
    let resultList = [];
    for (let index = 0; index < users.length; index++) {
      resultList.push(users[index].username);
    }
    console.log(resultList);
    res.status(200).json({
      resultList
    });
  });
});

// GET for logout logout
router.get("/logout", function(req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function(err) {
      if (err) {
        return next(err);
      } else {
        return res.redirect("/");
      }
    });
  }
});

module.exports = router;
