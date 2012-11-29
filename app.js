
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
  , qs = require("qs")

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
/*
app.get('/', function(req, res) {
    fs.readFile('views/draw.html', function(err, body) {
//	console.log("body="+body)
	res.render('layout.html', { 
	    title: 'Graffiti Code',
	    vocabulary: 'draw',
	    target: 'SVG',
	    login: 'Login',
	    body: body,
	}, function (error, html) {
	    if (error) res.send(400, error)
	    else res.send(html)
	})
    })
})
*/

app.get('/', function(req, res) {
    res.redirect("/draw")
})

app.get('/draw', function(req, res) {
    fs.readFile('views/draw.html', function(err, body) {
//	console.log("body="+body)
	res.render('layout.html', { 
	    title: 'Graffiti Code',
	    vocabulary: 'draw',
	    target: 'SVG',
	    login: 'Login',
	    body: body,
	}, function (error, html) {
	    if (error) res.send(400, error)
	    else res.send(html)
	})
    })
})


app.get('/bitzee', function(req, res) {
    fs.readFile('views/bitzee.html', function(err, body) {
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
app.get('/code/:id', function(req, res){
    var id = req.params.id
    pg.connect(conString, function(err, client) {
	client.query("SELECT * FROM pieces WHERE id = "+id, function(err, result) {
	    var rows
	    if (!result || result.rows.length===0) {
		rows = [{}]
	    }
	    else {
		rows = result.rows
	    }
//	    console.log("rows="+JSON.stringify(rows))
	    res.send(rows)
	})
	client.query("UPDATE pieces SET views = views + 1 WHERE id = "+id)
    })
})

// get the piece with :id
app.get('/graffiti/:id', function(req, res){
    var id = req.params.id
    pg.connect(conString, function(err, client) {
	client.query("SELECT obj FROM pieces WHERE id = "+id, function(err, result) {
	    var ret
	    if (!result || result.rows.length===0) {
		ret = ""
	    }
	    else {
		ret = result.rows[0].obj
	    }
//	    console.log("rows="+JSON.stringify(ret))
	    res.send(ret)
	})
	client.query("UPDATE pieces SET views = views + 1 WHERE id = "+id)
    })
})

/*
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
*/

// get list of piece ids
app.get('/pieces', function(req, res) {
    pg.connect(conString, function(err, client) {
	client.query("SELECT id FROM pieces ORDER BY views DESC, forks DESC, created DESC", function(err, result) {
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

// get pieces
app.get('/code', function(req, res) {
    pg.connect(conString, function(err, client) {
	var list = req.query.list
	var queryStr = "SELECT pieces.*, users.name FROM pieces, users WHERE pieces.user_id = users.id AND pieces.id IN ("+list+") ORDER BY views DESC, forks DESC, pieces.created DESC"
//	console.log("/code queryStr="+queryStr)
	client.query(queryStr, function(err, result) {
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
    var srcAst = req.body.ast
    var objAst = transformer.transform(srcAst)
    var obj = renderer.render(objAst)
//    console.log("/code ast="+JSON.stringify(srcAst))
//    console.log("/code obj="+obj)
    res.send(obj)
})

// commit and return commit id
app.post('/code', function(req, res){
    var src = req.body.src
    var obj = req.body.obj
    var user = req.body.user
    var parent = req.body.parent
    var views = 0
    var forks = 0

    parent = parent?parent:1
    user = user?user:1
    commit()
    function commit() {
	pg.connect(conString, function(err, client) {
	    src = src.replace(new RegExp("\n","g"), "\\n")
	    obj = obj.replace(new RegExp("\n","g"), " ")
	    obj = obj.replace(new RegExp("'","g"), "\"")
	    var queryStr = "INSERT INTO pieces (user_id, parent_id, views, forks, created, src, obj)" +
		           " VALUES ('"+user+"', '"+parent+"', '"+views+"', '"+forks+"', now(), '"+src+"', '"+obj+"');"
//	    console.log("queryStr="+queryStr)
	    client.query(queryStr, function(err, result) {
		var queryStr = "SELECT pieces.*, users.name FROM pieces, users WHERE pieces.user_id = users.id ORDER BY pieces.id DESC LIMIT 1"
//		console.log("POST /code queryStr="+queryStr)
		client.query(queryStr, function (err, result) {
//		    console.log("err="+err+" result="+JSON.stringify(result))
		    res.send(result.rows[0])
		})
		client.query("UPDATE pieces SET forks = forks + 1 WHERE id = "+parent+";")
	    })
	})
    }

})

/*
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
	    var data = ""
	    res.on('data', function (chunk) {
//		console.log("/code chunk="+chunk)
		data += chunk
	    })
	    res.on('end', function () {
		var id = JSON.parse(data).id
//		console.log("/code chunk.id="+id)
		pg.connect(conString, function(err, client) {
		    client.query("INSERT INTO pieces (commit) VALUES ("+id+");")
		    resPost.send({id: id})
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
*/

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

/*
 * GET home page.
 */

app.post('/login', function login (req, res) {
//    var audience = process.env.HOST + ":" + process.env.PORT  //"http://localhost:5000"
    var audience = process.env.AUDIENCE
//    console.log("POST /login audience="+audience)
    var vreq = https.request({
          host: "verifier.login.persona.org",
          path: "/verify",
          method: "POST"
    }, function(vres) {
	var body = "";
	vres.on('data', function(chunk) { body+=chunk; } )
            .on('end', function() {
		try {
		    var verifierResp = JSON.parse(body);
		    var valid = verifierResp && verifierResp.status === "okay";
		    var email = valid ? verifierResp.email : null;
		    req.session.email = email;
		    if (valid) {
//			console.log("assertion verified successfully for email:", email);
			getUserName(email);
		    } else {
//			console.log("failed to verify assertion:", verifierResp.reason);
			res.send(verifierResp.reason, 401);
		    }
		} catch(e) {
		    console.log("non-JSON response from verifier");
		    // bogus response from verifier!
		    res.send("bogus response from verifier!", 401);
		}
	    });
    });

    vreq.setHeader('Content-Type', 'application/x-www-form-urlencoded');
 
    var data = qs.stringify({
        assertion: req.body.assertion,
        audience: audience
    });
 
    vreq.setHeader('Content-Length', data.length);
    vreq.write(data);
    vreq.end();
 
//    console.log("verifying assertion!");

    function getUserName(email) {
	pg.connect(conString, function(err, client) {
	    var queryStr = "SELECT * FROM users WHERE email = '" + email + "'"
	    client.query(queryStr, function(err, result) {
//		console.log("getUserName() result="+JSON.stringify(result))
		if (!result.rows.length) {
		    var name = email.substring(0, email.indexOf("@"))
		    var queryStr = "INSERT INTO users (email, name, created) VALUES ('" + email + "', '" + name + "', now())"
//		    console.log("getUserName() queryStr="+queryStr)
		    client.query(queryStr, function(err, result) {
			var queryString = "SELECT * FROM users ORDER BY id DESC LIMIT 1"
			client.query(queryString, function (err, result) {
			    res.send(result.rows[0])
			})
		    })
		}
		else {
		    res.send(result.rows[0])
		}
	    })
	})
    }

})

app.post("/logout", function (req, res) {
  req.session.destroy()
  res.send("okay")
  //res.redirect('/');
})

