require('dotenv').config()
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var ejs = require('ejs');
var mysql = require("mysql");

var app = express();
//var email;

//For SendGrid Email
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

//set up sessions
var cookieParser = require('cookie-parser');

var session = require('express-session');

//allow sessions
app.use(session({ secret: 'app', cookie: { maxAge: 6 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 } }));
app.use(cookieParser());

var PORT = process.env.PORT || 3000;

if (process.env.JAWSDB_URL){
  var connection = mysql.createConnection(process.env.JAWSDB_URL);
}else {
  var connection = mysql.createConnection({
    port: 3306,
    host: "localhost",
    user: "root",
    password: "",
    database: "nw_db"
  });
}

connection.connect(function(err) {
  if (err) {
    console.error("error connecting: " + err.stack);
    return;
  }
  console.log("connected as id " + connection.threadId);


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set("view engine", "ejs"); 

app.use(express.static("public"));



app.get("/", function(req, res) {
 res.render( __dirname + "/views/main.ejs");
});

app.get("/home", function(req, res) {

  if (req.session.logged_in) {
    res.render(__dirname + "/views/home.ejs");
  } else {
    res.render(__dirname + "/views/main.ejs");
  }
});


app.get("/newevent", function(req, res) {
  
  if (req.session.logged_in) {
    res.render(__dirname + "/views/newevent.ejs");
  } else {
    res.render(__dirname + "/views/main.ejs");
  }
});

app.get("/login", function (req, res) {
  if (req.session.logged_in) {
    res.redirect("/home");
  }
  res.render(__dirname + "/views/login.ejs");
});


var email;

app.post("/sign-in", function (req, res) {
  if (req.session.logged_in) {
    res.redirect("/home");
  }
  
  var query = "SELECT * FROM users WHERE email = (?) AND password_hash = (?)";

  connection.query(query, [req.body.email, req.body.password_hash], function (err, result) {
    
    if (result.length > 0) {
      req.session.logged_in = true;
      req.session.email = result[0].email;
      
      email = req.session.email;

      res.redirect('/home');
    } else {
      res.redirect('/login');
    }
  });
});

app.get("/profile", function(req, res) {
        
  var query = "SELECT * FROM users where email = (?)"
    connection.query(query, [req.session.email], function(err, result){
      res.render( __dirname + "/views/profile.ejs", {data: result });
    
  });
});

app.get('/signup', function (req, res) {
  if (req.session.logged_in) {
    res.redirect('/home');
  }
  res.render(__dirname + "/views/signup.ejs");
});

app.post('/create-user', function (req, res) {
  if (req.session.logged_in) {
    res.redirect('/home');
  }

  var query = "INSERT INTO users (email, password_hash, first_name, last_name, campus, grad_date, site_link) VALUES (?, ?, ?, ?, ?, ?, ?)";

  connection.query(query, [req.body.email, req.body.password_hash, req.body.first_name, req.body.last_name, req.body.campus, req.body.grad_date, req.body.site_link], function (err, result) {
    console.log(err, result);
    if (err) {
      res.send('there was an error');
    }

    req.session.logged_in = true;
    req.session.email = req.body.email;

    const msg = {
      to: req.body.email,
      from: 'info@nwcodingbootcampnetwork.com',
      subject: 'Welcome to Northwestern Coding Bootcamp Network',
      // text: 'Hi ' + req.body.first_name + ',' + '\n' + 'Welcome to the Northwestern Coding Bootcamp Network, the premier network for current and past students to connect and share ideas.',
      html: '<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Northwestern_University_old_wordmark.svg/320px-Northwestern_University_old_wordmark.svg.png" alt="Northwestern Logo">' + '<p>Hi ' + req.body.first_name + ',' + '</p>' + '<p>Welcome to the Northwestern Coding Bootcamp Network, the premier network for current and past students to connect and share ideas.</p><p>Here is a quick summary of how to best utilize the network:</p><p><strong>My Profile</strong></p><p>Information about your profile. If you would like to make any edits please email support@nwcodingbootcampnetwork.com.</p><p><strong>My Network</strong></p><p>Lists everyone in the network along with their contact information, campus, graduation date and link to their personal portfolio.</p><p><strong>Events</strong></p><p>Everyone in the network has the ability to post upcoming events and meetups relevant to the community. It could be anything from a coffee shop meetup to practice fundamentals, to a hackathon to a networking happy hour.</p><p><strong>Jobs</strong></p><p>Everyone in the network also has the ability to share job opportunities with fellow students.</p><p>Thanks again for signing up and welcome aboard!</p><p>Cheers,</p><p>The Team at Northwestern Coding Bootcamp Network</p>',
    };
    sgMail.send(msg);

    res.redirect('/home');
  });
});

app.get("/signup", function (req, res) {
  res.render(__dirname + "/views/signup.ejs");
});

app.get('/logout', function(req,res){
  req.session.destroy(function(err) {
     res.redirect('/');
  })
});


app.get("/newjob", function(req, res) {

  if (req.session.logged_in) {
    res.render(__dirname + "/views/newjob.ejs");
  } else {
    res.render(__dirname + "/views/main.ejs");
  }
});

  app.post('/createevent', function(req, res){
    var newEvent = req.body;
    // console.log(newMember);
    var query = "INSERT INTO events (poster_email, event_name, location, posted_by, date, details) VALUES (?, ?, ?, ?, ?, ?)"
      connection.query(query, [req.body.poster_email, req.body.event_name, req.body.location, req.body.posted_by, req.body.date, req.body.details], function(err, response){
          if (err) throw err;
      });
    });

  app.get('/events', function(req, res){
  
    if (req.session.logged_in) {
      var query = "SELECT * FROM events";

	    connection.query(query, function(err, result) {
		  // res.json(result);
      res.render('events', {
      	events: result
      });
    });
    } else {
      res.render(__dirname + "/views/main.ejs");
    }

  });

  app.get("/network", function(req, res) {

    if (req.session.logged_in) {
      //var query = "SELECT * FROM users";
      var query = "SELECT * FROM users ORDER BY last_name";

      connection.query(query, function(err, result) {
        // res.json(result);
        res.render('network', {
          users: result
        });
      });
    } else {
      res.render(__dirname + "/views/main.ejs");
    }
  });

    app.post('/createjob', function(req, res){
      var newJob = req.body;
      
      var query = "INSERT INTO jobs (job_title, poster_name, poster_email, job_description, date_posted, link) VALUES (?, ?, ?, ?, ?, ?)";
        connection.query(query, [newJob.job_title, newJob.poster_name, newJob.poster_email, newJob.job_description,  newJob.date_posted, newJob.link], function(err, response){
            if (err) throw err;
        });
    });

  app.get("/jobs", function(req, res) {

    if (req.session.logged_in) {

      var query = "SELECT * FROM jobs";
    connection.query(query, function(err, result) {
		  // res.json(result);
      res.render('jobs', {
        jobs: result
      });
    });
    } else {
      res.render(__dirname + "/views/main.ejs");
    }
  });
});


app.listen(PORT, function(err){
    if (err) throw err
    console.log("Listening on port: " + PORT);
});