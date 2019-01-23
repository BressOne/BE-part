const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const httpModule = require("http");
const sockets = require("socket.io");
const connectMongo = require("connect-mongo");
const cors = require("cors");

const routes = require("./routes/router.js");

const app = express();

const http = httpModule.Server(app);
const io = sockets(http);

const corsOptions = {
  origin: true,
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

mongoose.connect(
  "mongodb://bress1992:Bress1992@ds253104.mlab.com:53104/heroku_9hwf61rm",
  { useNewUrlParser: true }
);

let db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("we are connected to DB!");
});

let MongoStore = connectMongo(session);

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
  User.findOneAndUpdate(
    socket.request.session.userId,
    { $set: { onlineStatus: true } },
    function(err) {
      if (err) console.log(err);
    }
  );
  socket.on("disconnect", function() {
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

io.listen(process.env.PORT || 8000);

app.listen(process.env.PORT || 3000, () => {
  console.log("Chat app listening on port " + (process.env.PORT || 3000));
});
