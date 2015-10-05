/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/**
 * Module dependencies.
 */

function print(str) {
  console.log(str)
}

var express = require('express');
var util = require('util');
var _ = require('underscore');
var fs = require('fs');
var http = require('http');
var https = require('https');
var transformer = require('./static/transform.js');
var renderer = require('./static/render.js');
var qs = require("qs");
var app = module.exports = express();
var morgan = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
//var session = require("express-session");
var errorHandler = require("errorhandler");
var timeout = require('connect-timeout');

var pg = require('pg');
var conString = process.env.DATABASE_URL;

console.log(conString);
//error handling omitted
pg.connect(conString, function(err, client) {
  client.query("SELECT NOW() as when", function(err, result) {
    console.log(result);
  })
});

// Configuration

app.set('views', __dirname + '/views');
app.set('public', __dirname + '/public');
app.use(morgan('combined', {
  skip: function (req, res) { return res.statusCode < 400 }
}));
//app.use(cookieParser('S3CRE7'));
//app.use(session({
//  key: 'app.sess',
//  secret: 'SUPERsekret'
//}));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false, limit: 10000000 }))

// parse application/json
app.use(bodyParser.json());

// parse application/text
app.use(bodyParser.text());
app.use(bodyParser.raw());

// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: 'application/vnd.api+json' }))

app.use(methodOverride());
app.use(express.static(__dirname + '/public'));
//app.use(session({ secret: 'keyboard cat' }));

app.use(function (err, req, res, next) {
  console.log("ERROR " + err.stack)
  next(err)
})

app.engine('html', function (templateFile, options, callback) {
  fs.readFile(templateFile, function (err, templateData) {
    var template = _.template(String(templateData));
    callback(err, template(options))
  });
});

// Routes

// http://stackoverflow.com/questions/7013098/node-js-www-non-www-redirection
app.all('*', function (req, res, next) {
  if (req.headers.host.match(/^www/) === null && req.headers.host.match(/^localhost/) === null) {
    res.redirect('http://www.'+ req.headers.host + req.url);
  } else {
    next();     
  }
});

app.get('/', function(req, res) {
  res.redirect("/index");
});

// lang?id=106
// item?id=12304
// data?author=dyer&sort=desc
app.get('/lang', function(req, res) {
  var id = req.query.id;
  var lang = "L" + id;
  res.render('views.html', { 
    title: 'Graffiti Code',
    language: lang,
    vocabulary: lang,
    target: 'SVG',
    login: 'Login',
    item: 0,
  }, function (error, html) {
    if (error) {
      res.send(400, error);
    } else {
      res.send(html);
    }
  });
});

app.get('/item', function(req, res) {
  var id = req.query.id;
  pg.connect(conString, function (err, client) {
    client.query("SELECT * FROM pieces WHERE id = " + id, function(err, result) {
      var rows;
      if (!result || result.rows.length===0) {
        rows = [{}];
      } else {
        var lang = result.rows[0].language;
        res.render('views.html', { 
          title: 'Graffiti Code',
          language: lang,
          vocabulary: lang,
          target: 'SVG',
          login: 'Login',
          item: id,
        }, function (error, html) {
          if (error) {
            res.send(400, error);
          } else {
            res.send(html);
          }
        });
      }
    });
    client.query("UPDATE pieces SET views = views + 1 WHERE id = "+id);
  });
});

app.get("/index", function (req, res) {
  res.sendFile("public/index.html");
});

app.get('/dr10', function (req, res) {
  res.send("<html>This URL has been decprecated. Try '/L101'");
});

app.get('/L102', function (req, res) {
  fs.readFile('views/L102.html', function (err, body) {
    res.render('layout.html', { 
      title: 'Graffiti Code',
      vocabulary: 'L102',
      target: 'SVG',
      login: 'Login',
      body: body,
    }, function (error, html) {
      if (error) {
        res.send(400, error);
      } else {
        res.send(html);
      }
    });
  });
});

app.get('/L104', function (req, res) {
  fs.readFile('views/L104.html', function (err, body) {
    res.render('layout.html', { 
      title: 'Graffiti Code',
      vocabulary: 'L104',
      target: 'HTML',
      login: 'Login',
      body: body,
    }, function (error, html) {
      if (error) {
        res.send(400, error);
      } else {
        res.send(html);
      }
    });
  });
});

app.get('/math', function (req, res) {
  fs.readFile('views/math.html', function (err, body) {
    res.render('layout.html', { 
      title: 'Graffiti Code',
      vocabulary: 'MATH',
      target: 'SVG',
      login: 'Login',
      body: body,
    }, function (error, html) {
      if (error) {
        res.send(400, error);
      } else {
        res.send(html);
      }
    });
  });
});

app.get('/debug', function (req, res) {
  fs.readFile('views/debug.html', function (err, body) {
    res.render('layout.html', { 
      title: 'Graffiti Code',
      vocabulary: 'DEBUG',
      target: 'SVG',
      login: 'Login',
      body: body,
    }, function (error, html) {
      if (error) {
        res.send(400, error);
      } else {
        res.send(html);
      }
    });
  });
});

// get the piece with :id
app.get('/code/:id', function (req, res) {
  var id = req.params.id;
   pg.connect(conString, function (err, client) {
    client.query("SELECT * FROM pieces WHERE id = "+id, function(err, result) {
      var rows;
      if (!result || result.rows.length===0) {
        rows = [{}];
      } else {
        rows = result.rows;
      }
      res.send(rows);
    });
    client.query("UPDATE pieces SET views = views + 1 WHERE id = "+id);
  });
});

// get the object code for piece with :id
app.get('/graffiti/:id', function (req, res) {
  var id = req.params.id;
  pg.connect(conString, function (err, client) {
    client.query("SELECT obj, img FROM pieces WHERE id=" + id, function (err, result) {
      var ret;
      if (!result || result.rows.length === 0) {
        ret = "";
      } else {
        ret = result.rows[0].img;
        if (!ret) {
          // For backward compatibility
          ret = result.rows[0].obj;
        }
      }
      res.send(ret);
    });
    client.query("UPDATE pieces SET views = views + 1 WHERE id = "+id);
  });
});

// get the object code for piece with :id
app.get('/graffiti/dr10/latest', function (req, res) {
  req.setTimeout(10000);
  req.on("timeout", function() {
    console.log("socket timeout");
  });
  pg.connect(conString, function (err, client) {
    var id, obj;
    client.query("SELECT id, obj FROM pieces WHERE language='L101' ORDER BY id DESC LIMIT 1", function (err, result) {
      var ret;
      if (!result || result.rows.length === 0) {
        obj = "";
      } else {
        obj = result.rows[0].obj;
        id = result.rows[0].id;
      }
      res.send(obj);
    });
    if (id) {
      client.query("UPDATE pieces SET views = views + 1 WHERE id = " + id);
    }
  });
});

// get list of piece ids
app.get('/pieces/:lang', function (req, res) {  
  var lang = req.params.lang;
  var search = req.query.q;
  pg.connect(conString, function (err, client) {
    var queryString, likeStr = "";
    if (search) {
      var ss = search.split(",");
      ss.forEach(function (s) {
        if (likeStr) {
          likeStr += " OR ";
        } else {
          likeStr += "(";
        }
        likeStr += "src like '%" + s + "%'";
      });
      if (likeStr) {
        likeStr += ") AND ";
      }
    }
    if (lang === "DEBUG") {
      queryString = "SELECT id FROM pieces ORDER BY id DESC";
    } else {
      queryString = "SELECT id FROM pieces WHERE language='" + lang +
        "' AND " + likeStr +
        "label = 'show' ORDER BY id DESC";
    }
    client.query(queryString, function (err, result) {
      var rows;
      if (!result || result.rows.length === 0) {
        console.log("no rows");
        var insertStr = 
          "INSERT INTO pieces (user_id, parent_id, views, forks, created, src, obj, language, label, img)" +
          " VALUES ('" + 0 + "', '" + 0 + "', '" + 0 +
          " ', '" + 0 + "', now(), '" + "| " + lang + "', '" + "" +
          " ', '" + lang + "', '" + "show" + "', '" + "" + "');"
        client.query(insertStr, function(err, result) {
          if (err) {
            res.send(400, err);
            return;
          }
          client.query(queryString, function (err, result) {
            res.send(result.rows);
          });
        });
      } else {
        res.send(result.rows);
      }
    });
  });
});

app.get('/items', function(req, res) {
  var data = "";
  req.on("data", function (chunk) {
    console.log("/items chunk=" + chunk);
    data += chunk;
  });
  req.on('end', function () {
    console.log("GET /items data=" + data);
    pg.connect(conString, function (err, client) {
      var list = JSON.parse(data);
      var queryStr =
        "SELECT * FROM pieces WHERE pieces.id" +
        " IN ("+list+") ORDER BY pieces.id DESC";
      client.query(queryStr, function (err, result) {
        var rows;
        if (!result || result.rows.length === 0) {
          rows = [{}];
        } else {
          rows = result.rows;
        }
        res.send(rows)
      });
    });
  });
  req.on('error', function(e) {
    console.log(e);
    res.send(e);
  });
});

// Get pieces
app.get('/code', function (req, res) {
  pg.connect(conString, function (err, client) {
    var list = req.query.list;
    console.log("GET /code query=" + Object.keys(req));
    var queryStr =
      "SELECT * FROM pieces WHERE pieces.id" +
      " IN ("+list+") ORDER BY pieces.id DESC";
    client.query(queryStr, function (err, result) {
      var rows;
      if (!result || result.rows.length === 0) {
        rows = [{}];
      } else {
        rows = result.rows;
      }
      res.send(rows)
    });
  });
});

function getCompilerHost(language) {
  if (port === 3000) {
    return "localhost";
  } else {
    return language + ".artcompiler.com";
  }
}

function getCompilerPort(language) {
  if (port === 3000) {
    return "5" + language.substring(1);  // e.g. L103 -> 5103
  } else {
    return "80";
  }
}

function retrieve(language, path, response) {
  var data = [];
  var options = {
    host: getCompilerHost(language),
    port: getCompilerPort(language),
    path: "/" + path,
  };
  var req = http.get(options, function(res) {
    res.on("data", function (chunk) {
      data.push(chunk);
    }).on("end", function () {
      response.send(data.join(""));
    });
  });
}
function cleanAndTrim(str) {
  str = str.replace(new RegExp("\n","g"), " ");
  while(str.charAt(0) === " ") {
    str.shift();
  }
  while(str.charAt(str.length - 1) === " ") {
    str = str.substring(0, str.length - 1);
  }
  return str;
}
function compile(language, src, result, response) {
  // Handle legacy case
  var path = "/compile";
  var data = {
    "description": "graffiticode",
    "language": language,
    "src": src,
  };
  var encodedData = JSON.stringify(data);
  var options = {
    host: getCompilerHost(language),
    port: getCompilerPort(language),
    path: path,
    method: 'GET',
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': encodedData.length
    },
  };
  var obj = null;
  var req = http.request(options, function(res) {
    var data = "";
    res.on('data', function (chunk) {
      data += chunk;
    });
    res.on('end', function () {
      var n = cleanAndTrim(data);
      if (result && result.rows.length === 1) {
        var o = cleanAndTrim(result.rows[0].obj);
      }
      if (o !== n) {
        // Either the source doesn't exist or the compile produced a different result.
        var val = {
          obj: data
        };
      } else {
        // Compile already done, so return previous result.
        var rows = result.rows;
        var val = {
          obj: rows[0].obj,
          id: rows[0].id,
        };
      }
      response.send(val);
    });
  });
  req.write(encodedData);
  req.end();
  req.on('error', function(e) {
    console.log("ERR01 " + e);
    response.send(e);
  });
}

// Compile code (idempotent)
app.put('/compile', function (req, res) {
  var ast = JSON.parse(req.body.ast);
  var src = req.body.src;
  var language = req.body.language;
  pg.connect(conString, function (err, client) {
    client.query("SELECT * FROM pieces WHERE language='" + language + "' AND src = '" + src + "' ORDER BY pieces.id DESC LIMIT 1", function(err, result) {
      compile(language, ast, result, res);
    });
  });
});

// Commit and return commit id
app.post('/code', function (req, res){
  var language = req.body.language;
  var src = req.body.src;
  var obj = req.body.obj;
  var user = req.body.user;
  var parent = req.body.parent;
  var img = req.body.img;
  var label = req.body.label;
  parent = parent ? parent : 1;
  user = user ?user : 1;
  commit();
  function commit() {
    var views = 0;
    var forks = 0;
    pg.connect(conString, function (err, client) {
//      src = src.replace(new RegExp("\n","g"), "\\n");
      obj = obj.replace(new RegExp("\n","g"), " ");
      obj = obj.replace(new RegExp("'","g"), "\"");
      img = img.replace(new RegExp("\n","g"), " ");
      img = img.replace(new RegExp("'","g"), "\"");
      var queryStr = 
        "INSERT INTO pieces (user_id, parent_id, views, forks, created, src, obj, language, label, img)" +
        " VALUES ('" + user + "', '" + parent + "', '" + views +
        " ', '" + forks + "', now(), '" + src + "', '" + obj +
        " ', '" + language + "', '" + label + "', '" + img + "');"
      client.query(queryStr, function(err, result) {
        if (err) {
          res.send(400, err);
          return;
        }
        var queryStr =
          "SELECT pieces.* FROM pieces ORDER BY pieces.id DESC LIMIT 1";
        client.query(queryStr, function (err, result) {
          res.send(result.rows[0]);
        })
        client.query("UPDATE pieces SET forks = forks + 1 WHERE id = "+parent+";");
      });
    });
  }
});

app.post('/gist', function (req, resPost) {
  var id = req.body.id;
  var src = req.body.src;
  var obj = req.body.obj;
  if (id === 0) {
    // need to archive code to archive
  }
  commit();
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
    };
    var gistDataEncoded = JSON.stringify(gistData);
    var options = {
      host: 'api.github.com',
      path: '/gists',
      method: 'POST',
      headers: {'Content-Type': 'text/plain',
                'Content-Length': gistDataEncoded.length},
    };
    var gistReq = https.request(options, function(res) {
      var data = "";
      res.on('data', function (chunk) {
        data += chunk;
      });
      res.on('end', function () {
        var gist_id = JSON.parse(data).id;
        pg.connect(conString, function(err, client) {
          client.query("UPDATE pieces SET gist_id = '"+gist_id+"' WHERE id = '"+id+"'");
          resPost.send({id: id, gist_id: gist_id});
        });
      });
    });
    gistReq.write(gistDataEncoded);
    gistReq.end();
    gistReq.on('error', function(e) {
      res.send("ERR02 " + e);
    });
  }
});

// Get a label
app.get('/label', function (req, res) {
  var id = req.body.id;
  pg.connect(conString, function (err, client) {
    var label = "";
    client.query("SELECT label FROM pieces WHERE id = '" + id + "'",  function (err, result) {
      if (result || result.rows.length === 1) {
        label = result.rows[0].label;
      }
    });
    res.send(label)
  });
});

// Update a label
app.put('/label', function (req, res) {
  var id = req.body.id;
  var label = req.body.label;
  pg.connect(conString, function (err, client) {
    client.query("UPDATE pieces SET label = '" + label + "' WHERE id = '" + id + "'");
    res.send(200)
  });
});

// Update a code
app.put('/code', function (req, res) {
  var id = req.body.id;
  var src = req.body.src;
//  src = src.replace(new RegExp("\n","g"), "\\n");
  if (!id) {
    res.send(500);
  } else {
    pg.connect(conString, function (err, client) {
      client.query("UPDATE pieces SET src = '" + src + "' WHERE id = '" + id + "'");
      res.send(200);
    });
  }
});

// Delete the notes for a label
app.delete('/code/:id', ensureAuthenticated, function (req, res) {
  var id = req.params.id;
  pg.connect(conString, function (err, client) {
    client.query("DELETE FROM todos WHERE id='"+id+"'", function (err, result) {
      res.send(500);
    });
  });
});

// Update a note
app.put('/code/:id', ensureAuthenticated, function (req, res) {
  var id = req.params.id;
  pg.connect(conString, function (err, client) {
    client.query("UPDATE todos SET text='"+req.body.text+"' WHERE id="+id, function (err, result) {
      res.send(result.rows)
    });
  })
});

// Post a note for a label
app.post('/notes', ensureAuthenticated, function (req, res) {
  pg.connect(conString, function(err, client) {
    client.query("INSERT INTO todos (label, text) VALUES ('"+req.body.label+"', '"+req.body.text+"')");
    res.send(req.body);
  });
});

app.get('/about', function (req, res) {
  res.render('about', {
    title: 'About',
    user: req.user,
  });
});

app.get('/contact', function (req, res) {
  res.render('contact', {
    title: 'Contact',
    user: req.user,
  });
});

app.get('/todos', function (req, res) {
  var url = req.url;
  var file = __dirname + "/public/svg/" + url.substring(url.indexOf("?")+1);
  res.sendfile(file);
});

app.get('/archive', function (req, res) {
  var url = req.url;
  ensureAuthenticated(req, res, function () {
    res.redirect("/todos.html");
  });
});

app.get("/:lang/:path", function (req, res) {
  var language = req.params.lang;
  var path = req.params.path;
  retrieve(language, path, res);
});

// This is the new way of loading pages
app.get('/:lang', function (req, res) {
  var lang = req.params.lang;
  res.redirect('/lang?id=' + lang.substring(1));
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
  var audience = process.env.AUDIENCE
  var vreq = https.request({
    host: "verifier.login.persona.org",
    path: "/verify",
    method: "POST",
  }, function (vres) {
    var body = "";
    vres.on('data', function (chunk) {
      body+=chunk;
    }).on('end', function () {
      try {
        var verifierResp = JSON.parse(body);
        var valid = verifierResp && verifierResp.status === "okay";
        var email = valid ? verifierResp.email : null;
        req.session.email = email;
        if (valid) {
          getUserName(email);
        } else {
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
  
  function getUserName(email) {
    pg.connect(conString, function (err, client) {
      var queryStr = "SELECT * FROM users WHERE email = '" + email + "'";
      client.query(queryStr, function (err, result) {
        if (!result.rows.length) {
          var name = email.substring(0, email.indexOf("@"))
          var queryStr =
            "INSERT INTO users (email, name, created)" +
            " VALUES ('" + email + "', '" + name + "', now())";
          client.query(queryStr, function(err, result) {
            var queryString = "SELECT * FROM users ORDER BY id DESC LIMIT 1"
            client.query(queryString, function (err, result) {
              res.send(result.rows[0])
            });
          });
        } else {
          res.send(result.rows[0]);
        }
      });
    });
  }
});

app.post("/logout", function (req, res) {
  req.session.destroy()
  res.send("okay")
});

if (process.env.NODE_ENV === 'development') {
  app.use(errorHandler({dumpExceptions: true, showStack: true}))
}

if (process.env.NODE_ENV === 'production') {
  app.use(errorHandler())
}

process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err.stack);
});
