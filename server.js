let express = require("express");
let app = express();

let bodyParser = require("body-parser");

let mongoose = require("mongoose");

let session = require("express-session");
mongoose.connect(
  "mongodb://bress1992:Bress1992@ds253104.mlab.com:53104/heroku_9hwf61rm",
  { useNewUrlParser: true }
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
  secret: "work hard for Warudo!",
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
let Dialogue = require("./schemas/dialogueSchema.js");
let User = require("./schemas/userSchema.js");

io.use(function(socket, next) {
  if (!socket.request.session) {
    if (socket) {
      socket.disconnect();
      console.log(
        "some smart-ass wanted to send smthing via socketIO without auth!"
      );
    }
  } else {
    User.findById(socket.request.session.userId).exec((error, user) => {
      if (user === null) {
        socket.disconnect();
        console.log(
          "some smart-ass wanted to send smthing via socketIO without auth!"
        );
      } else {
        return next();
      }
    });
  }
});

io.on("connection", function(socket) {
  console.log("a user connected");
  User.findOneAndUpdate(
    socket.request.session.userId,
    { $set: { onlineStatus: true } },
    function(err) {
      if (err) console.log(err);
    }
  );
  socket.on("disconnect", function() {
    console.log("User Disconnected");
    User.findOneAndUpdate(
      socket.request.session.userId,
      { $set: { onlineStatus: false } },
      function(err) {
        if (err) console.log(err);
      }
    );
  });
  socket.on("message_emit_sent", function(msg) {
    let senderID = socket.request.session.userId,
      acceptorID = msg.toUsername,
      message = msg.message,
      dateTime = {};
    console.log(senderID);
    User.findOne({ username: msg.toUsername })
      .exec()

      .then(visavee => {
        Dialogue.findOne({
          $or: [
            {
              userIDs: {
                first: visavee._id.toString(),
                second: socket.request.session.userId.toString()
              }
            },

            {
              userIDs: {
                first: socket.request.session.userId.toString(),
                second: visavee._id.toString()
              }
            }
          ]
        })
          .exec()
          .then(dialogue => {
            if (dialogue) {
              dateTime = new Date();
              Dialogue.updateOne(
                { _id: dialogue._id },
                {
                  $push: {
                    messages: {
                      senderID: socket.request.session.userId,
                      content: msg.message,
                      dateTime: dateTime
                    }
                  }
                }
              )
                .exec()
                .then(console.log("sent"))
                .catch(err => {
                  console.log(err);
                });
            } else {
              let newDialogue = new Dialogue({
                userIDs: {
                  first: socket.request.session.userId,
                  second: visavee._id
                },
                messages: [
                  {
                    content: msg.message,
                    senderID: socket.request.session.userId,
                    dateTime: new Date()
                  }
                ]
              });
              newDialogue.save(err => {
                if (err) {
                  console.log(err);
                } else {
                  console.log("sent");
                }
              });
            }
            return;
          })

          .catch(error => {
            console.log(error);
          });
      })
      .then(() => socket.to(`${senderID}`).emit("hey", "I just met you"))
      .catch(error => {
        console.log(error);
      });
  });
});

io.listen(process.env.PORT || 8000, () => {console.log("SIO listening on port " + process.env.PORT || 8000)});


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
//app.listen(3000, () => {
  console.log("Chat app listening on port " + process.env.PORT || 3000);
});
