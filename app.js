/**
 * Module dependencies.
 */

function print(str) {
  console.log(str)
}

var express = require('express');
var _ = require('underscore');
var fs = require('fs');
var http = require('http');
var https = require('https');
var app = module.exports = express();
var morgan = require("morgan");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var errorHandler = require("errorhandler");
var pg = require('pg');
var redis = require('redis');
var cache = redis.createClient(process.env.REDIS_URL);
var main = require('./main.js');
var conString = process.env.DATABASE_URL;

if (conString.indexOf("localhost") < 0) {
  pg.defaults.ssl = true;
}
// Configuration
var env = process.env.NODE_ENV || 'development';

app.all('*', function (req, res, next) {
  // http://stackoverflow.com/questions/7013098/node-js-www-non-www-redirection
  // http://stackoverflow.com/questions/7185074/heroku-nodejs-http-to-https-ssl-forced-redirect
  if (req.headers.host.match(/^localhost/) === null) {
    if (req.headers['x-forwarded-proto'] !== 'https' && env === 'production') {
      console.log("app.all redirecting headers=" + JSON.stringify(req.headers, null, 2) + " url=" + req.url);
      res.redirect(['https://', req.headers.host, req.url].join(''));
    } else {
      next();
    }
  } else {
    next();
  }
});

app.set('views', __dirname + '/views');
app.set('public', __dirname + '/public');
app.use(morgan('combined', {
  skip: function (req, res) { return res.statusCode < 400 }
}));

app.use(bodyParser.urlencoded({ extended: false, limit: 10000000 }));
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.raw());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(methodOverride());
app.use(express.static(__dirname + '/public'));
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Something broke!')
});
app.engine('html', function (templateFile, options, callback) {
  fs.readFile(templateFile, function (err, templateData) {
    var template = _.template(String(templateData));
    callback(err, template(options))
  });
});

// Routes

// letsencript acme challenge
// app.get('/.well-known/acme-challenge/1m10T3oPsyaWnJdFHk_OR5ro5GFqWQxCbvoRr5kfvm4', function(req, res) {
//   res.send("1m10T3oPsyaWnJdFHk_OR5ro5GFqWQxCbvoRr5kfvm4.Fzpon67yOJjoArf9Yosy2tR5vF2zLd5fJ3tSglCuLoI");
// });

// http://stackoverflow.com/questions/10435407/proxy-with-express-js
var request = require('request');
app.get("/spokenmathplay", (req, res) => {
  request("https://learnosity.artcompiler.com/form?id=494386").pipe(res);
});
app.get("/spokenmathspec", (req, res) => {
  request("https://learnosity.artcompiler.com/form?id=490914").pipe(res);
});
app.get("/mathgenproposal", (req, res) => {
  request("https://learnosity.artcompiler.com/form?id=498441").pipe(res);
});
app.get("/mathcore2proposal", (req, res) => {
  request("https://learnosity.artcompiler.com/form?id=498441").pipe(res);
});

app.get('/', function(req, res) {
  res.redirect("/index");
});

app.get('/item', function(req, res) {
  let protocol;
  if (req.headers.host.match(/^localhost/) === null) {
    protocol = "https://";
  } else {
    protocol = "http://";
  }
  let url = [protocol, req.headers.host, req.url.replace("item", "form")].join('');
  res.redirect(url);
});

// BEGIN REUSE

var dbQuery = function(query, resume) {
  // Query Helper -- https://github.com/brianc/node-postgres/issues/382
  pg.connect(conString, function (err, client, done) {
    // If there is an error, client is null and done is a noop
    if (err) {
      console.log("[1] dbQuery() err=" + err);
      return resume(err);
    }
    try {
      client.query(query, function (err, result) {
        done();
        return resume(err, result);
      });
    } catch (e) {
      console.log("[2] dbQuery() e=" + e);
      done();
      return resume(e);
    }
  });
};

var getItem = function (id, resume) {
  // TODO Support compound ids like 12345 43523 93845
  // Get an item from the cache, or from the db and then cache it.
  cache.get(id, (err, val) => {
    if (val) {
      resume(null, JSON.parse(val));
    } else {
      dbQuery("SELECT * FROM pieces WHERE id = " + id, function(err, result) {
        // Here we get the language associated with the id. The code is gotten by
        // the view after it is loaded.
        let val;
        if (!result || result.rows.length === 0) {
          val = {};
        } else {
          //assert(result.rows.length === 1);
          val = result.rows[0];
        }
        cache.set(id, JSON.stringify(val));
        resume(err, val);
      });
      dbQuery("UPDATE pieces SET views = views + 1 WHERE id = " + id, ()=>{});
    }
  });
};

function parseJSON(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.log("ERROR parsing JSON: " + JSON.stringify(str));
    console.log(e.stack);
    return null;
  }
}

// lang?id=106
// item?id=12304
// data?author=dyer&sort=desc
// lang?id=106&src=equivLiteral "1+2" "1+2" --> item id
app.get('/lang', function(req, res) {
  var id = req.query.id;
  var src = req.query.src;
  var lang = "L" + id;
  var type = req.query.type;
  if (src) {
    get(lang, "lexicon.js", function (err, data) {
      var lstr = data.substring(data.indexOf("{"));
      var lexicon = JSON.parse(lstr);
      var ast = main.parse(src, lexicon, function (err, ast) {
        if (ast) {
          compile(0, 0, 0, lang, src, ast, null, null, {
            json: function (data) {
              if (type === "id") {
                res.json(parseJSON(data));
              } else if (type === "data") {
                res.redirect('/data?id=' + data.id);
              } else {
                res.redirect('/form?id=' + data.id);
              }
            }
          });
        } else {
          res.status(400).send(err);
        }
      });
      return;
    });
  } else {
    getCompilerVersion(lang, (version) => {
      res.render('views.html', {
        title: 'Graffiti Code',
        language: lang,
        vocabulary: lang,
        target: 'SVG',
        login: 'Login',
        item: 0,
        data: undefined,
        version: version,
      }, function (error, html) {
        if (error) {
          res.status(400).send(error);
        } else {
          res.send(html);
        }
      });
    });
  }
});

app.get('/form', function(req, res) {
  var ids = req.query.id.split(" ");
  var id = ids[0];  // First id is the item id.
  getItem(id, function(err, row) {
    var lang = row.language;
    getCompilerVersion(lang, (version) => {
      res.render('form.html', {
        title: 'Graffiti Code',
        language: lang,
        vocabulary: lang,
        target: 'SVG',
        login: 'Login',
        item: ids[0],
        data: ids[1] ? ids[1] : undefined,
        view: "form",
        version: version,
      }, function (error, html) {
        if (error) {
          res.status(400).send(error);
        } else {
          res.send(html);
        }
      });
    });
  });
});

app.get('/data', function(req, res) {
  // If data id is supplied, then recompile with that data.
  let ids = req.query.id.split(" ");
  let codeId = ids[0];  // First id is the item id.
  let dataId = ids[1];
  getItem(codeId, function(err, item) {
    if (err) {
      res.status(400).send(err);
    } else {
      if (dataId) {
        // We have data so recompile with that data.
        let language = item.language;
        let ast = item.ast;
        getItem(dataId, (err, item) => {
          let data = JSON.parse(item.obj);
          comp(language, ast, data, (err, obj) => {
            res.json(obj);
          });
        });
      } else {
        res.json(JSON.parse(item.obj));
      }
    }
  });
});

app.get('/code', (req, res) => {
  // Get the source code for an item.
  console.log("GET /code id=" + JSON.stringify(req.query.id));
  var ids = req.query.id.split(" ");
  var codeId = ids[0];
  getItem(codeId, (err, row) => {
    // No data provided, so obj code won't change.
    res.json({
      id: codeId,
      src: row.src,
    });
  });
});

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

let compilerVersions = {};
function getCompilerVersion(language, resume) {
  if (compilerVersions[language]) {
    resume(compilerVersions[language]);
  } else {
    var data = [];
    var options = {
      host: getCompilerHost(language),
      port: getCompilerPort(language),
      path: "/version",
    };
    var req = http.get(options, function(res) {
      res.on("data", function (chunk) {
        data.push(chunk);
      }).on("end", function () {
        let str = data.join("");
        let version = parseInt(str.substring(1));
        version = compilerVersions[language] = isNaN(version) ? 0 : version;
        resume(version);
      });
    });
  }
}

function get(language, path, resume) {
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
      resume([], data.join(""));
    }).on("error", function () {
      resume(["ERROR"], "");
    });
  });
}

function cleanAndTrimObj(str) {
  if (!str) {
    return str;
  }
  str = str.replace(new RegExp("'","g"), "''");
  str = str.replace(new RegExp("\n","g"), " ");
  while(str.charAt(0) === " ") {
    str = str.substring(1);
  }
  while(str.charAt(str.length - 1) === " ") {
    str = str.substring(0, str.length - 1);
  }
  return str;
}
function cleanAndTrimSrc(str) {
  if (!str || typeof str !== "string") {
    return str;
  }
  str = str.replace(new RegExp("'","g"), "''");
  while(str.charAt(0) === " ") {
    str = str.substring(1);
  }
  while(str.charAt(str.length - 1) === " ") {
    str = str.substring(0, str.length - 1);
  }
  return str;
}

// Commit and return commit id
function postItem(language, src, ast, obj, user, parent, img, label, resume) {
  // ast is a JSON object
  var views = 0;
  var forks = 0;
  obj = cleanAndTrimObj(obj);
  img = cleanAndTrimObj(img);
  src = cleanAndTrimSrc(src);
  ast = cleanAndTrimSrc(JSON.stringify(ast));
  parent = typeof parent === "string" ? parent.split("+")[0] : 0;
  var queryStr =
    "INSERT INTO pieces (user_id, parent_id, views, forks, created, src, obj, language, label, img, ast)" +
    " VALUES ('" + user + "', '" + parent + "', '" + views +
    " ', '" + forks + "', now(), '" + src + "', '" + obj +
    " ', '" + language + "', '" + label + "', '" + img + "', '" + ast + "');"
  dbQuery(queryStr, function(err, result) {
    if (err) {
      console.log("postItem() ERROR: " + queryStr);
      resume(err);
    } else {
      var queryStr = "SELECT pieces.* FROM pieces ORDER BY pieces.id DESC LIMIT 1";
      dbQuery(queryStr, function (err, result) {
        resume(err, result);
        dbQuery("UPDATE pieces SET forks = forks + 1 WHERE id = " + parent + ";", () => {});
      });
    }
  });
};

// Commit and return commit id
function updateItem(id, language, src, ast, obj, user, parent, img, label, resume) {
  var views = 0;
  var forks = 0;
  obj = cleanAndTrimObj(obj);
  img = cleanAndTrimObj(img);
  src = cleanAndTrimSrc(src);
  ast = cleanAndTrimSrc(JSON.stringify(ast));
  var query =
    "UPDATE pieces SET " +
    "src='" + src + "', " +
    "ast='" + ast + "', " +
    "obj='" + obj + "' " +
    "WHERE id='" + id + "'";
  dbQuery(query, function (err) {
    resume(err, []);
  });
};

function comp(language, code, data, resume) {
  // Compile ast to obj.
  var path = "/compile";
  var encodedData = JSON.stringify({
    "description": "graffiticode",
    "language": language,
    "src": code,
    "data": data,
  });
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
  var req = http.request(options, function(res) {
    var data = "";
    res.on('data', function (chunk) {
      data += chunk;
    });
    res.on('end', function () {
      resume(null, parseJSON(data));
    });
    res.on('error', function (err) {
      resume(err);
    });
  });
  req.write(encodedData);
  req.end();
  req.on('error', function(err) {
    console.log("ERROR " + err);
    resume(err);
  });
}

function compile(id, user, parent, language, src, ast, data, rows, response) {
  // Compile ast to obj.
  var path = "/compile";
  var encodedData = JSON.stringify({
    "description": "graffiticode",
    "language": language,
    "src": ast,
    "data": data,
  });
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
  var req = http.request(options, function(res) {
    var obj = "";
    res.on('data', function (chunk) {
      obj += chunk;
    });
    res.on('end', function () {
      rows = rows ? rows : [];
      if (rows.length === 0) {
        // We don't have an existing item with the same source, so add one.
        var img = "";
        var label = "show";
        // New item.
        postItem(language, src, ast, obj, user, parent, img, label, function (err, data) {
          if (err) {
            response.status(400).send(err);
          } else {
            response.json({
              id: data.rows[0].id,
              obj: parseJSON(obj),
            });
          }
        });
      } else if (rows.length === 1 && (rows[0].obj !== obj || rows[0].ast !== ast)) {
        var row = rows[0];
        id = id ? id : row.id;
        user = row.user_id;
        parent = row.parent_id;
        var img = row.img;
        var label = row.label;
        updateItem(id, language, src, ast, obj, user, parent, img, label, function (err, data) {
          if (err) {
            console.log(err);
          }
        });
        // Don't wait for update. We have what we need to respond.
        response.json({
          id: id,
          obj: parseJSON(obj),
        });
      } else {
        // No update needed. Just return the item.
        response.json({
          id: rows[0].id,
          obj: parseJSON(rows[0].obj),
        });
      }
    });
  });
  req.write(encodedData);
  req.end();
  req.on('error', function(e) {
    console.log("ERR01 " + e);
    response.send(e);
  });
}

// Compile code
app.put('/compile', function (req, res) {
  // PUT /compile does two things:
  // -- compile the given AST.
  // -- updates the object code of any items whose object code differs from the result.
  var id = req.body.id;
  var dataId = req.body.dataId;
  var parent = req.body.parent;
  var src = req.body.src;
  var ast = JSON.parse(req.body.ast);
  var language = req.body.language;
  var ip = req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
  var user = dot2num(ip); //req.body.user;
  var q;
  if (id) {
    // Prefer the given id if there is one.
    q = "SELECT * FROM pieces WHERE id='" + id + "'";
  } else {
    // Otherwise look for an item with matching source.
    q = "SELECT * FROM pieces WHERE language='" + language + "' AND src = '" + cleanAndTrimSrc(src) + "' ORDER BY id";
  }
  dbQuery(q, function(err, result) {
    // See if there is already an item with the same source for the same
    // language. If so, pass it on.
    var obj;
    if (err) {
      res.status(400).send(err);
    } else {
      let rows = result.rows;
      if (dataId) {
        // We have data so recompile with that data.
        dbQuery("SELECT * FROM pieces WHERE id = " + dataId, (err, result) => {
          let data = JSON.parse(result.rows[0].obj)
          compile(id, user, parent, language, src, ast, data, rows, res);
        });
      } else {
        // No data provided.
        compile(id, user, parent, language, src, ast, null, rows, res);
      }
    }
  });
});

app.put('/code', (req, response) => {
  var id = req.body.id;
  var src = req.body.src;
  var language = req.body.language;
  var ip = req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
  var user = dot2num(ip); //req.body.user;
  var query;
  if (id) {
    id = id.split("+")[0];  // Get codeId.
    // Prefer the given id if there is one.
    query = "SELECT * FROM pieces WHERE id='" + id + "'";
  } else {
    // Otherwise look for an item with matching source.
    query = "SELECT * FROM pieces WHERE language='" + language + "' AND src = '" + src + "' ORDER BY pieces.id";
  }
  dbQuery(query, function(err, result) {
    // See if there is already an item with the same source for the same language. If so, pass it on.
    var row = result.rows[0];
    var id = id ? id : row ? row.id : undefined;  // Might still be undefined if there is no match.
    if (id) {
      // Prefer the request values of existing row values.
      //var id = req.body.id ? req.body.id : row.id;
      //        var language = req.body.language ? req.body.language : row.language;
      var language = row.language;
      var src = req.body.src ? req.body.src : row.src;
      var ast = req.body.ast ? JSON.parse(req.body.ast) : row.ast;
      var obj = req.body.obj ? req.body.obj : row.obj;
      //        var user = req.body.user_id ? req.body.user_id : row.user_id;
      var parent = req.body.parent_id ? req.body.parent_id : row.parent_id;
      var img = req.body.img ? req.body.img : row.img;
      var label = req.body.label ? req.body.label : row.label;
      updateItem(id, language, src, ast, obj, user, parent, img, label, function (err, data) {
        if (err) {
          console.log(err);
        }
      });
      // Don't wait for update. We have what we need to respond.
      response.json({
        id: id,
      });
    } else {
      //var id = req.body.id;
      var src = req.body.src;
      var language = req.body.language;
      var ast = req.body.ast ? JSON.parse(req.body.ast) : {};  // Possibly undefined.
      var obj = req.body.obj;
      var label = req.body.label;
      var parent = 0;
      var img = "";
      postItem(language, src, ast, obj, user, parent, img, label, function (err, data) {
        if (err) {
          response.status(400).send(err);
        } else {
          response.json({
            id: data.rows[0].id,
          });
        }
      });
    }
  });
});

// From http://javascript.about.com/library/blipconvert.htm
function dot2num(dot) {
  var d = dot.split('.');
  var n = ((((((+d[0])*256)+(+d[1]))*256)+(+d[2]))*256)+(+d[3]);
  if (isNaN(n)) {
    return 0;
  }
  return n;
}
function num2dot(num) {
  var d = num%256;
  for (var i = 3; i > 0; i--) {
    num = Math.floor(num/256);
    d = num%256 + '.' + d;}
  return d;
}

app.get("/:lang/:path", function (req, res) {
  var language = req.params.lang;
  var path = req.params.path;
  retrieve(language, path, res);
});

// END REUSE

function getCompilerHost(language) {
  if (port === 3001) {
    return "localhost";
  } else {
    return language + ".artcompiler.com";
  }
}

function getCompilerPort(language) {
  if (port === 3001) {
    return "5" + language.substring(1);  // e.g. L103 -> 5103
  } else {
    return "80";
  }
}

dbQuery("SELECT NOW() as when", function(err, result) {
  console.log(result);
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

if (!module.parent) {
  var port = process.env.PORT || 3001;
  app.listen(port, function() {
    console.log("Listening on " + port);
  });
}
