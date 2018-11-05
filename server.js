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
    passwConf = false;
    usernameIsFree = false;
    emailIsFree = false;
    passIsEmpty = true;
    console.log(req);
    console.log(postedForm);
  emailValidate(postedForm.email) ? emailCorrect = true : emailCorrect = false;
  postedForm.password === postedForm.passwordConf ? passwConf = true : passwConf  = false;
  postedForm.password === "" ? passIsEmpty = true : passIsEmpty = false;

  if (emailCorrect &&  passwConf && !passIsEmpty) {
    let submitteduser = new User ({
      email: postedForm.email,
      username: postedForm.username,
      password: postedForm.password
    });
    submitteduser.save(function (err) {
      if (err) 
      {
        res.end('Seems like email or username is currently in use!');    
        
      } else {
        res.end('Successfully saved!');
      };
      });
    
  } else {
    let resultError = "";
    if (!emailCorrect) {
      resultError = resultError + "Keep yourself together! Your e-mail is incorrect\n"
    }
    if (!passwConf) {
      resultError = resultError + "Keep up! Your passwords are not same!\n"
    }
    if (passIsEmpty) {
      resultError = resultError + "You are easy victim! Your password is empty!\n"
    }
    
    res.end(resultError);
  }
}); 

