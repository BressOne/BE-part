let express = require("express");
let app = express();

let mongoose = require("mongoose");

let emailValidate = require("./modules/emailvalidate.js");
let cors = require("cors");

let path = require("path");

let bodyParser = require("body-parser");
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

// let morgan = require("morgan");

let methodOverride = require("method-override");
app.use(methodOverride());

let cookieParser = require("cookie-parser");
app.use(cookieParser("scary_secret"));

// app.use(express.session());
let session = require("express-session");
app.use(
  session({
    secret: "work hard",
    resave: true,
    saveUninitialized: false
  })
);

let passport = require("passport");
let LocalStrategy = require("passport-local").Strategy;
app.use(passport.initialize());
app.use(passport.session());
//app.use(app.router);
app.use(express.static(path.join(__dirname, "public")));

// passport config
let User = require("./schemas/userSchema.js");
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// routes
// require("./routes")(app);

mongoose.connect(
  "mongodb://localhost/passportDB",
  { useNewUrlParser: true }
);
let db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {
  console.log("we are connected to DB!");
});

app.listen(3000, function() {
  console.log("listening on port 3000!");
});

// app.get("/", function(req, res) {
//   res.sendFile(__dirname + "/simplehtml.html");
// });

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
    console.log("all is correct and validated");
    User.register(
      new User({ email: postedForm.email, username: postedForm.username }),
      postedForm.password,
      function(err, account) {
        if (err) {
          res.json({
            message: "Seems like email or username is currently in use!"
          });
        }
        console.log(err);
        passport.authenticate("local")(req, res, function() {
          res.json({
            message: "Saved!"
          });
        });
      }
    );
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

app.post("/login", passport.authenticate("local"), function(req, res) {
  console.log(req.body);
  res.status(200).json({
    message: "Access granted",
    loginPermission: true
  });
});

// app.post("/login", function(req, res) {
//   let postedForm = req.body;
//   console.log(req.body);
//   User.findOne({ username: postedForm.loginusername }, function(err, user) {
//     console.log(user);
//     if (user) {
//       if (user.checkPassword(postedForm.loginpassword)) {
//         res.status(200).json({
//           message: "Access granted",
//           loginPermission: true
//         });
//       } else {
//         res.status(200).json({
//           message: "Wrong username or pass.",
//           loginPermission: false
//         });
//       }
//     } else {
//       res.status(200).json({
//         message: "Wrong username or pass.",
//         loginPermission: false
//       });
//     }
//   });
// });

app.post("/search_person", function(req, res) {
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
