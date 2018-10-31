let express = require('express');
let app = express();
let mongoose = require('mongoose');
let bodyParser = require('body-parser');
let emailValidate = require('./modules/emailvalidate.js');
let User = require('./schemas/userSchema.js');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost/test', { useNewUrlParser: true });
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("we are connected to DB!")
});



app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/simplehtml.html');
});

app.post('/', function (req, res) {
  let postedForm = req.body,
   emailCorrect = false,
   userNameAndEmailAreFree = false,
   passwConf = false;
  if (emailValidate(postedForm.email)) {
    emailCorrect = true;
  } else {
    emailCorrect = false;
  };
  if (postedForm.password === postedForm.passwordConf) {
    passwConf = true;
  } else {
    passwConf  = false;
  };
  if (User.find({ username: postedForm.username }) || User.find({ email: postedForm.email })) {
    userNameAndEmailAreFree = false;
  } else {
    userNameAndEmailAreFree = true;
  }
  if (emailCorrect && userNameAndEmailAreFree && passwConf) {
    let submitteduser = new User ({
      email: postedForm.email,
      username: postedForm.username,
      password: postedForm.password
    });
    submitteduser.save(function (err) {
      if (err) return console.error(err);
      });
    res.end('Successfully saved!');
  } else {
    res.end('Some kind of err');
  }
}); 



/* var testSchema = new Schema({
  name: String
});

testSchema.methods.naming = function () {
  var greeting = this.name
    ? "Name is " + this.name
    : "I don't have a name";
  console.log(greeting);
};

var Test = mongoose.model('Someone', testSchema);

var someMan = new Test({ name: 'man' });
someMan.naming();

someMan.save(function (err, someMan) {
  if (err) return console.error(err);
  someMan.naming();
});

Test.find(function (err, someones) {
  if (err) return console.error(err);
  console.log(someones);
});

Test.find({ name: /^an/ }); */
