let express = require("express");
let app = express();
let bodyParser = require("body-parser");
let mongoose = require("mongoose");
let session = require("express-session");
// let MongoStore = require("connect-mongo")(session);
// mongoose.Promise = global.Promise;
//connect to MongoDB
mongoose.connect("mongodb://localhost/whatever_DB");
let db = mongoose.connection;

//handle mongo error
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {
  console.log("we are connected to DB!");
});

//use sessions for tracking logins
app.use(
  session({
    secret: "work hard",
    resave: true,
    saveUninitialized: false
  })
);

// parse incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// include routes
const routes = require("./routes/router.js");
app.use("/", routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error("File Not Found");
  err.status = 404;
  next(err);
});

// error handler
// define as the last app.use callback
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send(err.message);
});

// listen on port 3000
app.listen(3000, function() {
  console.log("Example app listening on port 3000!");
});
