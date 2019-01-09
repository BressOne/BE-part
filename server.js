let express = require("express");
let app = express();

let bodyParser = require("body-parser");

let mongoose = require("mongoose");

let session = require("express-session");
mongoose.connect(
  "mongodb://bress1992:Bress1992@ds253104.mlab.com:53104/heroku_9hwf61rm"
);

//mongoose.connect("mongodb://localhost/chatDB");
let db = mongoose.connection;

let cors = require("cors");

var MongoStore = require("connect-mongo")(session);

app.use(
  session({
    secret: "work hard",
    resave: true,
    saveUninitialized: false,
    store: new MongoStore({
      mongooseConnection: db
    })
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let corsOptions = {
  origin: false,
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

app.options("*", cors(corsOptions));

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("we are connected to DB!");
});

const routes = require("./routes/router.js");
app.use("/", routes);

app.use((req, res, next) => {
  let err = new Error("File Not Found");
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send(err.message);
});

app.listen(3000, () => {
  console.log("Chat app listening on port 3000!");
});
