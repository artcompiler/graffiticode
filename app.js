
/**
 * Module dependencies.
 */

function print(str) {
//    console.log(str)
}
    
var express = require('express')
  , util = require('util')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , _ = require('underscore')
  , fs = require('fs')
  , http = require('http')
  , https = require('https')
  , transformer = require('./static/transform.js')
  , renderer = require('./static/render.js')

var app = module.exports = express();

// begin passportjs setup

var users = [
    { id: 1, username: 'Jeff', password: 'mtnview', email: 'jeff@artcompiler.org' }
  , { id: 2, username: 'Mary', password: 'ucla', email: 'mary@dyerart.com' }
  , { id: 3, username: 'Lars', password: 'oslo', email: 'lth@acm.org' }
  , { id: 4, username: 'Jesse', password: 'mtnview', email: 'jesse@artcompiler.org' }
];

function findById(id, fn) {
  var idx = id - 1;
  if (users[idx]) {
    fn(null, users[idx]);
  } else {
    fn(new Error('User ' + id + ' does not exist'));
  }
}

function findByUsername(username, fn) {
    for (var i = 0, len = users.length; i < len; i++) {
	var user = users[i];
	if (user.username.toLowerCase() === username.toLowerCase()) {
	    return fn(null, user);
	}
    }
    return fn(null, null);
}

/*
// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  findById(id, function (err, user) {
    done(err, user);
  });
});


// Use the LocalStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.
passport.use(new LocalStrategy(
  function(username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      findByUsername(username, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unkown user ' + username }); }
        if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
        return done(null, user);
      })
    });
  }
));
*/

// end passportjs setup

var pg = require('pg'); 
//or native libpq bindings
//var pg = require('pg').native

var conString = process.env.DATABASE_URL
//console.log("conString="+conString)

//error handling omitted
pg.connect(conString, function(err, client) {
  client.query("SELECT NOW() as when", function(err, result) {
//    console.log("Row count: %d",result.rows.length);  // 1
//    console.log("Current year: %d", result.rows[0].when.getYear());
  })
})

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views')
  app.use(express.logger())
  app.use(express.cookieParser())
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(require('stylus').middleware({ src: __dirname + '/static' }));
  app.use(express.static(__dirname + '/static'));
  app.use(express.session({ secret: 'keyboard cat' }));
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
//  app.use(passport.initialize());
//  app.use(passport.session());
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

app.engine('html', function (templateFile, options, callback) {
    fs.readFile(templateFile, function (err, templateData) {
	var template = _.template(String(templateData));
	callback(err, template(options))
    })
})

// Routes

app.get('/', function(req, res) {
    fs.readFile('views/index.html', function(err, body) {
//	console.log("body="+body)
	res.render('layout.html', { 
	    title: 'Graffiti Code',
	    vocabulary: 'Triangle',
	    target: 'SVG',
	    login: 'Login',
	    body: body,
	}, function (error, html) {
	    if (error) res.send(400, error)
	    else res.send(html)
	})
    })
})


// get the piece with :id
app.get('/code/:id', function(req, outerRes){
    var id = req.params.id
//    console.log("/code/:id id="+id)
    var options = {
	host: 'api.github.com',
	path: '/gists/'+id,
	method: 'GET',
    }
    var gistReq = https.request(options, function(res) {
//	console.log("Got response: " + res.statusCode)
//	console.log("res="+JSON.stringify(res.headers))
	res.on('data', function (chunk) {
	    outerRes.send(chunk)
	})
    })
    gistReq.end()
    gistReq.on('error', function(e) {
//	console.log("Got error: " + e.message);
	res.send(e)
    })
})

// get N pieces
app.get('/code', function(req, res){
    pg.connect(conString, function(err, client) {
	client.query("SELECT * FROM pieces", function(err, result) {
	    var rows
	    if (!result || result.rows.length===0) {
		rows = [{}]
	    }
	    else {
		rows = result.rows
	    }
	    res.send(rows)
	})
    })
})

// compile code (idempotent)
app.put('/code', function(req, res) {
//    var src = req.body.src
//    console.log("/code req.body.ast="+req.body.ast)
    var srcAst = req.body.ast
    var objAst = transformer.transform(srcAst)
    var obj = renderer.render(objAst)
    res.send(obj)
})

// commit and return commit id
app.post('/code', function(req, resPost){
    var src = req.body.src
    var obj = req.body.obj
    commit()
    function commit() {
	var gistData = {
	    "description": "graffiticode",
	    "public": true,
	    "files": {
		"src": {
		    "content": src
		},
		"obj": {
		    "content": obj
		}
	    }
	}
	var gistDataEncoded = JSON.stringify(gistData)
	var options = {
	    host: 'api.github.com',
	    path: '/gists',
	    method: 'POST',
	    headers: {'Content-Type': 'text/plain',
		      'Content-Length': gistDataEncoded.length},
	}
	var gistReq = https.request(options, function(res) {
//	    console.log("Got response: " + res.statusCode)
//	    console.log("res.headers="+JSON.stringify(res.headers))
	    res.on('data', function (chunk) {
		var id = JSON.parse(chunk).id
//		console.log("/code chunk="+chunk)
//		console.log("/code chunk.id="+id)
		pg.connect(conString, function(err, client) {
		    client.query("INSERT INTO pieces (commit) VALUES ("+id+");")
		    resPost.send(chunk)
		})
	    })
	})
	gistReq.write(gistDataEncoded)
	gistReq.end()
	gistReq.on('error', function(e) {
//	    console.log("Got error: " + e.message);
	    res.send(e)
	})
    }
})

// deletes the notes for that label
app.del('/code/:id', ensureAuthenticated, function(req, res){
    var id = req.params.id
//    console.log("delete id="+id);
    pg.connect(conString, function(err, client) {
	client.query("DELETE FROM todos WHERE id='"+id+"'", function(err, result) {
//	    console.log("result=" + util.format("%j", result))
	    res.send(result.rows)
	});
    });
});

 // update a note
app.put('/code/:id', ensureAuthenticated, function(req, res){
    var id = req.params.id
//    console.log("put id="+id)
    pg.connect(conString, function(err, client) {
	client.query("UPDATE todos SET text='"+req.body.text+"' WHERE id="+id, function(err, result) {
//	    console.log("result=" + util.format("%j", result))
	    res.send(result.rows)
	});
    })
});

// post a note for a label
app.post('/notes', ensureAuthenticated, function(req, res){
//    console.log("post req.body=" + req.url)
    pg.connect(conString, function(err, client) {
	client.query("INSERT INTO todos (label, text) VALUES ('"+req.body.label+"', '"+req.body.text+"')")
	res.send(req.body)
    });
});

app.get('/about', function(req, res){
    res.render('about', {
   	  title: 'About'
	, user: req.user 
    });
});

app.get('/contact', function(req, res){
    res.render('contact', {
	  title: 'Contact'
	, user: req.user 
    });
});

app.get('/todos', function(req, res){
    var url = req.url
    //var file = "http://s3.amazonaws.com/codecartography/svg/"+url.substring(url.indexOf("?")+1)    
    var file = __dirname + "/public/svg/" + url.substring(url.indexOf("?")+1)    
//    console.log("file="+file);
    res.sendfile(file)
});

app.get('/archive', function(req, res){
    var url = req.url
    ensureAuthenticated(req, res, function() {
	res.redirect("/todos.html")
    })
});

// begin passportjs routes

app.get('/login', function(req, res){
  res.render('login', {
        title: 'Login'
      , user: req.user
      , message: req.flash('error')
  });
});

app.post('/login',
  passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), function(req, res) {
      res.redirect('/');
  });
  
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { 
        title: "Account"
      , user: req.user 
  });
});


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login')
}


if (!module.parent) {
    var port = process.env.PORT || 3000;
    app.listen(port, function() {
	console.log("Listening on " + port);
    });
}

