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

router.use(function(req, res, next) {
  console.log(req.url);
  if (
    req.url === "/login" ||
    req.url === "/register" ||
    req.method === "OPTIONS"
  ) {
    console.log("not restricted area request");
    return next();
  } else {
    console.log("restricted area request");
    console.log(req.session.userId);

    User.findById(req.session.userId).exec(function(error, user) {
      if (req.url === "") {
        console.log("blank url");
        res.sendStatus(400);
        res.end();
        return;
      } else {
        if (user === null) {
          res.sendStatus(401);
          res.end();
          return;
        } else {
          return next();
        }
      }
    });
  }
});

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
      req.session.userId = user._id;
      res.status(200).json({
        message: "Access granted",
        loginPermission: true
      });
    }
  });
});

router.post("/search_person", function(req, res) {
  const pattern = req.body.searchValue;
  User.find({ username: { $regex: `${pattern}`, $options: "i" } }, function(
    err,
    users
  ) {
    let resultList = users.map(function(user) {
      if (user._id == req.session.userId) {
      } else {
        return user.username;
      }
    });
    resultList = resultList.filter(function(el) {
      return el !== undefined;
    });
    res.json({
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

router.post("/addContact", function(req, res, next) {
  let newContactID = "",
    currentContactList = "";

  Promise.all([
    User.findOne({ username: req.body.username })
      .then(user => {
        return user._id;
      })
      .catch(err => {
        console.log(err);
      }),
    User.findOne({ _id: req.session.userId })
      .then(user => {
        return user.contacts;
      })
      .catch(err => {
        console.log(err);
      })
  ]).then(results => {
    newContactID = results[0];
    currentContactList = results[1];
    if (newContactID == req.session.userId) {
      res.sendStatus(400);
      res.end();
    } else {
      if (currentContactList.indexOf(newContactID) === -1) {
        User.updateOne(
          { _id: req.session.userId },
          { $push: { contacts: newContactID } }
        )

          .then(
            res.json({
              message: "added successfully"
            })
          )
          .catch(err => console.log(err));
      } else {
        console.log("tryna add contact that is already in list!");
        res.sendStatus(400);
        res.end();
      }
    }
  });
});

router.get("/getContacts", function(req, res) {
  User.findById(req.session.userId).exec((err, user) => {
    let promiseArray = user.contacts.map(function(id) {
      return User.findById(id)
        .exec()
        .then(user => {
          console.log(user.username);
          return user.username;
        })
        .catch(err => console.log(err));
    });
    return Promise.all(promiseArray)
      .then(array => {
        console.log(array);
        res.json(array);
        return array;
      })
      .catch(err => consolelog(err));
  });
});

module.exports = router;
