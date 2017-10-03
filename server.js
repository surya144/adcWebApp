const express = require('express');
const path = require('path');
const mysql = require('mysql');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const port = process.env.PORT;
const host = process.env.HOST;

var course1 = 0, course2 = 0;

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(session({
    secret : process.env.SECRET,
    resave: true,
    saveUninitialized: true,
    cookie : {
      maxAge : 1000 * 60 * 60 * 24
    }
  })
);

//mysql config object and establish connection
var sqlConnection = mysql.createConnection( {
  host: process.env.DBHOST,
  port: process.env.DBPORT,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.DBNAME
});
sqlConnection.connect(
  (err) => {
    if (err)
      console.error('sqlConnection' + err + 'nodejsServer');
    else
      console.log('mysql server is connected!');
  }
);

function validateUser(request) {
  return ( (typeof request.session.userId) !== 'undefined');
}
function validateAdmin(request) {
  return ( (typeof request.session.admin) !== 'undefined');
}

//GET resources
app.get('/favicon.ico',
  (req, res) => res.sendFile(path.join(__dirname,'favicon.ico'))
);
app.get('/admin.html',
  (req, res) => res.sendFile(path.join(__dirname,'pages','admin.html'))
);
app.get('/course-android.jpg',
  (req, res) => res.sendFile(path.join(__dirname,'pages','course-android.jpg'))
);
app.get('/course-bg.jpg',
  (req, res) => res.sendFile(path.join(__dirname,'pages','course-bg.jpg'))
);
app.get('/course-java.jpg',
  (req, res) => res.sendFile(path.join(__dirname,'pages','course-java.jpg'))
);
app.get('/course-python.jpg',
  (req, res) => res.sendFile(path.join(__dirname,'pages','course-python.jpg'))
);
app.get('/course.html',
(req, res) => res.sendFile(path.join(__dirname,'pages','course.html'))
);
app.get('/credits.html',
(req, res) => res.sendFile(path.join(__dirname,'pages','credits.html'))
);
app.get('/event.html',
(req, res) => res.sendFile(path.join(__dirname,'pages','event.html'))
);
app.get('/feedback.html',
(req, res) => res.sendFile(path.join(__dirname,'pages','feedback.html'))
);
app.get('/home-modi.jpg',
  (req, res) => res.sendFile(path.join(__dirname,'pages','home-modi.jpg'))
);
app.get('/home-sritLogo.jpg',
  (req, res) => res.sendFile(path.join(__dirname,'pages','home-sritLogo.jpg'))
);
app.get('/home.html',
(req, res) => res.sendFile(path.join(__dirname,'pages','home.html'))
);
app.get('/login.html',
  (req, res) => res.sendFile(path.join(__dirname,'pages','login.html'))
);
app.get('/member.html',
  (req, res) => res.sendFile(path.join(__dirname,'pages','member.html'))
);
app.get('/mreq.html',
  (req, res) => res.sendFile(path.join(__dirname,'pages','mreq.html'))
);

//ajax endpoints
app.get('/admin/logout',
  (req, res) => {
    if (!validateAdmin(req)) {
      console.log('info' + '/unapproved' + 'admin validation failed' + req._remoteAddress);
      res.status(401).send('unauthorised');
    }else{
      delete req.session.admin;
      res.status(200).send('success');
    }
  }
);
app.get('/memberlist',
  (req, res) => {
    sqlConnection.query('SELECT name FROM members WHERE verified=true',
      (err, result) => {
        if (err) {
          console.error('/memberlist' + err + req._remoteAddress);
          res.status(500).send('internal server error');
        } else {
          res.status(200).send(JSON.stringify(result));
        }
      }
    );
  }
);
app.get('/logout',
  (req, res) => {
    if (!validateUser(req)) {
      console.log('info' + '/logout' + 'user validation failed' + req._remoteAddress);
      res.status(401).send('unauthorised');
    }else{
      delete req.session.userId;
      res.status(200).send('success');
    }
  }
);
app.get('/enrollnumbers/:course',
  (req, res) => {
    const course = req.params.course;
    switch(course){
      case '1':
        res.send(course1.toString());
        break;
      case '2':
        res.status(200).send(course2.toString());
        break;
      default:
        res.status(200).send('failed');
    }
  }
);
app.get('/unapproved',
  (req, res) => {
    if (!validateAdmin(req)) {
      console.log('info' + '/unapproved' + 'admin validation failed' + req._remoteAddress);
      res.status(401).send('unauthorised');
    }else{
      sqlConnection.query('SELECT * FROM members WHERE verified = false',
        (err, result) => {
          if (err) {
            console.error('/unapproved' + err + req._remoteAddress);
            res.status(500).send('internal server error');
          } else {
            res.status(200).send(JSON.stringify(result));
          }
        }
      );
    }
  }
);
app.get('/listFeedback',
  (req, res) => {
    if (!validateAdmin(req)) {
      console.log('info' + '/listFeedback' + 'admin validation failed' + req._remoteAddress);
      res.status(401).send('unauthorised');
    }else {
      var query = 'SELECT m.name, f.content FROM members AS m INNER JOIN feedback AS f ON m.id = f.userId';
      sqlConnection.query(query,
        (err, result) => {
          if (err) {
            console.error('/listFeedback' + err + req._remoteAddress);
            res.status(500).send('internal server error');
          } else {
            res.status(200).send(JSON.stringify(result));
          }
        }
      );
    }
  }
);
app.post('/admin/login',
  (req, res) => {
    const name = req.body.name;
    const password = req.body.password;
    console.log(name +','+password);
    console.log(req.body);
    if(name === 'admin' && password === 'random'){
      req.session.admin = 'true';
      res.status(200).send('success');
    }else{
      res.status(200).send('failed');
    }
  }
);
app.post('/request',
  (req, res) => {
    const name = req.body.name;
    const password = req.body.password;
    const rollno = req.body.rollno;
    const query = 'INSERT INTO members(name, rollno, password) values('
      + sqlConnection.escape(name) + ','
      + sqlConnection.escape(rollno) + ','
      + sqlConnection.escape(password) + ')';
    sqlConnection.query(query,
      (err, result, fields) => {
        if (err) {
          console.error('/request' + err + req._remoteAddress);
          res.status(200).send('duplication');
        }else {
          res.status(200).send('sent');
        }
      }
    );
  }
);
app.post('/feedback',
  (req, res) => {
     if (!validateUser(req)) {
      console.log('info' + '/feedback' + 'user validation failed' + req._remoteAddress);
      res.status(401).send('unauthorised');
    }else {
      const content = req.body.content;
      const query = 'INSERT INTO feedback(userId, content) values('
        + req.session.userId + ','
        + sqlConnection.escape(content) + ')';
      sqlConnection.query(query,
        (err, result, fields) => {
          if (err) {
            console.error('/feedback' + err + req._remoteAddress);
            res.status(200).send('duplication');
          }else {
            res.status(200).send('submitted');
          }
        }
      );
    }
  }
);
app.post('/accept',
  (req, res) => {
    if (!validateAdmin(req)) {
      console.log('info' + '/accept' + 'admin validation failed' + req._remoteAddress);
      res.status(401).send('unauthorised');
    }else {
      const id = req.body.id;
      const query = 'UPDATE members SET verified = true WHERE id = ' + id;
      sqlConnection.query(query,
        (err, result, fields) => {
          if (err){
            console.error('/accept' + err + req._remoteAddress);
            res.status(400).send('bad data');
          }else {
            res.status(200).send(result.affectedRows == 1 ? 'success' : 'failed');
          }
        }
      );
    }
  }
);
app.post('/login',
  (req, res) => {
    const name = req.body.name;
    const password = req.body.password;
    const query = 'SELECT * FROM user WHERE verified = true AND name = '
      + sqlConnection.escape(name) + ' AND password = '
      + sqlConnection.escape(password);
    sqlConnection.query(query,
      (err, result) => {
        if (err) {
          console.error('/login' + err + req._remoteAddress);
          res.status(400).send('bad request');
        } else {
          if (result.length != 0) {
            req.session.userId = result[0].id;
            res.status(200).send('success');
          } else {
            res.status(200).send('failed');
          }
        }
      }
    );
  }
);
app.post('/enroll',
  (req, res) => {
     if (!validateUser(req)) {
      console.log('info' + '/enroll' + 'user validation failed' + req._remoteAddress);
      res.status(401).send('unauthorised');
    }else {
      const course = req.body.course;
      switch(course){
        case '1':
          course1++;
          res.status(200).send('enrolled');
          break;
        case '2':
          course2++;
          res.status(200).send('enrolled');
          break;
        default:
          res.status(200).send('failed');
      }
    }
  }
);
app.listen(port, host,
  () => console.log(`Android app development club is listening on port ${port}!`)
);
