let emailValidate = require("../modules/emailvalidate.js");

let express = require("express");

let router = express.Router();

let User = require("../schemas/userSchema.js");
let Dialogue = require("../schemas/dialogueSchema.js");

let bodyParser = require("body-parser");
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

let cors = require("cors");

let corsOptions = {
  origin: true,
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: true,
  optionsSuccessStatus: 204
};
router.use(cors(corsOptions));

router.options("*", cors(corsOptions));

router.use((req, res, next) => {
  // console.log(req.session);
  if (
    req.url === "/login" ||
    req.url === "/register" ||
    req.method === "OPTIONS" ||
    req.url === "/handshake"
  ) {
    return next();
  } else {
    User.findById(req.session.userId).exec((error, user) => {
      if (req.url === "") {
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

router.post("/register", (req, res) => {
  let postedForm = req.body,
    emailCorrect = false,
    passwConf = false;
  emailIsFree = false;
  passIsEmpty = true;

  emailCorrect = emailValidate(postedForm.email);
  passwConf = postedForm.password === postedForm.passwordConf;
  passIsEmpty = postedForm.password === "";

  if (emailCorrect && passwConf && !passIsEmpty) {
    let submitteduser = new User({
      email: postedForm.email,
      username: postedForm.username,
      password: postedForm.password
    });
    submitteduser.save(err => {
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

router.get("/handshake", (req, res) => {
  User.findById(req.session.userId)
    .exec()
    .then(user => {
     if (user === null) {
        res.json({ handshake: false });
        return;
      } else {
        res.json({ handshake: true });
      }
      res.end();
    });
});

router.post("/login", (req, res) => {
  let postedForm = req.body;
  User.authenticate(postedForm.username, postedForm.password, (error, user) => {
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

router.post("/search_person", (req, res) => {
  const pattern = req.body.searchValue;
  User.find(
    { username: { $regex: `${pattern}`, $options: "i" } },
    (err, users) => {
      let resultList = users.map(user => {
        if (user._id == req.session.userId) {
        } else {
          return user.username;
        }
      });
      resultList = resultList.filter(el => {
        return el !== undefined;
      });
      res.json({
        resultList
      });
    }
  );
});

router.get("/logout", (req, res, next) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        return next(err);
      } else {
        return res.json("loggedOut");
      }
    });
  }
});

router.post("/addContact", (req, res, next) => {
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
        res.sendStatus(400);
        res.end();
      }
    }
  });
});

router.delete("/deleteContact", (req, res, next) => {
  User.findById(req.session.userId)
    .exec()
    .then(user => {
      let contacts = user.contacts;
      let deleteUser = "";
      User.findOne({ username: req.body.username })
        .exec()
        .then(user => {
          deleteUser = user;
          if (contacts.indexOf(deleteUser._id) === -1) {
            res.sendStatus(400);
            res.end();
          } else {
            User.updateOne(
              { _id: req.session.userId },
              { $pull: { contacts: deleteUser._id } }
            )
              .exec()
              .then(
                res.json({
                  message: "removed successfully"
                })
              );
          }
        })
        .catch(err => {
          console.log(err);
        });
    })
    .catch(err => {
      console.log(err);
    });
});

router.get("/getContacts", (req, res) => {
  User.findById(req.session.userId).exec((err, user) => {
    let promiseArray = user.contacts.map(id => {
      return User.findById(id)
        .exec()
        .then(user => {
          return {name: user.username, onlineStatus: user.onlineStatus}
        })
        .catch(err => console.log(err));
    });
    return Promise.all(promiseArray)
      .then(array => {
        res.json(array);
        return array;
      })
      .catch(err => consolelog(err));
  });
});

router.post("/getDialogueMessages", (req, res) => {
  let visavee = User.findOne({ username: req.body.username })
    .exec()
    .then(visaveeObj => {
      return visaveeObj;
    });
  let user = User.findOne({ _id: req.session.userId })
    .exec()
    .then(user => {
      return user;
    });

  Promise.all([visavee, user]).then(values => {
    let user = values[1],
      visavee = values[0];
    if (user.contacts.indexOf(visavee._id) !== -1) {
      Dialogue.findOne({
        $or: [
          {
            userIDs: {
              first: visavee._id.toString(),
              second: user._id.toString()
            }
          },

          {
            userIDs: {
              first: user._id.toString(),
              second: visavee._id.toString()
            }
          }
        ]
      })
        .exec()
        .then(dialogue => {
          if (!dialogue) {
            let payload = {
              sender: "System",
              content: "No any messages. Write your first",
              dateTime: new Date()
            };
            res.json({ messages: payload });
            res.end();
          } else {
            Promise.all(
              dialogue.messages.map(message => {
                let senderUserName =
                  message.senderID == user._id ? "You" : visavee.username;
                let payload = {
                  sender: senderUserName,
                  content: message.content,
                  dateTime: message.dateTime
                };

                return payload;
              })
            ).then(result => {
              res.json(result);
            });
          }
        });
    } else {
      res.status(400);
      res.end();
    }
  });
});
// legacy non-socket messaging route
// router.post("/postMessage", (req, res) => {
//   User.findOne({ username: req.body.toUsername })
//     .exec()

//     .then(visavee => {
//       Dialogue.findOne({
//         $or: [
//           {
//             userIDs: {
//               first: visavee._id.toString(),
//               second: req.session.userId.toString()
//             }
//           },

//           {
//             userIDs: {
//               first: req.session.userId.toString(),
//               second: visavee._id.toString()
//             }
//           }
//         ]
//       })
//         .exec()
//         .then(dialogue => {
//           if (dialogue) {
//             Dialogue.updateOne(
//               { _id: dialogue._id },
//               {
//                 $push: {
//                   messages: {
//                     senderID: req.session.userId,
//                     content: req.body.message,
//                     dateTime: new Date()
//                   }
//                 }
//               }
//             )
//               .exec()
//               .then(
//                 res.json({
//                   message: "sent success"
//                 })
//               )
//               .catch(err => {
//                 console.log(err);
//                 res.status(400);
//                 res.end();
//               });
//           } else {
//             let newDialogue = new Dialogue({
//               userIDs: {
//                 first: req.session.userId,
//                 second: visavee._id
//               },
//               messages: [
//                 {
//                   content: req.body.message,
//                   senderID: req.session.userId,
//                   dateTime: new Date()
//                 }
//               ]
//             });
//             newDialogue.save(err => {
//               if (err) {
//                 res.status(400);
//                 res.end();
//               } else {
//                 res.json({ message: "sent success;" });
//               }
//             });
//           }
//         })
//         .catch(error => {
//           console.log(error);
//         });
//     })
//     .catch(error => {
//       console.log(error);
//     });
// });

module.exports = router;
