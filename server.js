let express = require("express");
let app = express();

let bodyParser = require("body-parser");

let mongoose = require("mongoose");

let session = require("express-session");
mongoose.connect(
  "mongodb://bress1992:Bress1992@ds253104.mlab.com:53104/heroku_9hwf61rm"
);

const http = require("http").Server(app);
const io = require("socket.io")(http);

let db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("we are connected to DB!");
});

let MongoStore = require("connect-mongo")(session);

let sessionMiddleware = session({
  secret: "work hard",
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: db
  })
});
io.use(function(socket, next) {
  sessionMiddleware(socket.request, socket.request.res, next);
});

app.use(sessionMiddleware);

const SIOroutes = require("./routes/SIOrouter.js");
app.use("/", SIOroutes);

io.on("connection", function(socket) {
  console.log("a user connected");
  socket.on("disconnect", function() {
    console.log("User Disconnected");
  });
  socket.on("message_emit_sent", function(msg) {
    console.log("toUser: " + msg.toUsername);
    console.log("message: " + msg.message);
    console.log("cookie: " + socket.request.session.userId);
  });
});
io.listen(8000);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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

app.listen(process.env.PORT || 3000, () => {
  console.log("Chat app listening on port " + process.env.PORT);
});
