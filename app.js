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
var main = require('./main.js');
var pg = require('pg');
var conString = process.env.DATABASE_URL;
// Query Helper
// https://github.com/brianc/node-postgres/issues/382
var dbQuery = function(query, resume) {
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
  // Get an item from the cache, or from the db and then cache it.
  // cache.get(id, (err, val) => {
  //   if (val) {
  //     resume(null, JSON.parse(val));
  //   } else {
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
        // cache.set(id, JSON.stringify(val));
        resume(err, val);
      });
      dbQuery("UPDATE pieces SET views = views + 1 WHERE id = " + id, ()=>{});
  //   }
  // });
};

if (conString.indexOf("localhost") < 0) {
  pg.defaults.ssl = true;
}
dbQuery("SELECT NOW() as when", function(err, result) {
  console.log(result);
});

// Configuration

var env = process.env.NODE_ENV || 'development';

// http://stackoverflow.com/questions/7013098/node-js-www-non-www-redirection
// http://stackoverflow.com/questions/7185074/heroku-nodejs-http-to-https-ssl-forced-redirect
app.all('*', function (req, res, next) {
  if (req.headers.host.match(/^localhost/) === null) {
    if (req.url === "/artcompiler") {
      res.redirect('https://www.graffiticode.com/form?id=471917');
    } else if (req.headers.host.match(/^www/) === null) {
      console.log("app.all redirecting headers=" + JSON.stringify(req.headers, null, 2) + " url=" + req.url);
      res.redirect('https://www.'+ req.headers.host + req.url);
    } else if (req.headers['x-forwarded-proto'] !== 'https' && env === 'production') {
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

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false, limit: 10000000 }));
// parse application/json
app.use(bodyParser.json());
// parse application/text
app.use(bodyParser.text());
app.use(bodyParser.raw());
// parse application/vnd.api+json as json
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
// app.get('/.well-known/acme-challenge/Fat9s216-BheFxzOVTCk2BpbQqDEnE_Jh49sAZFAxgo', function(req, res) {
//   res.send("Fat9s216-BheFxzOVTCk2BpbQqDEnE_Jh49sAZFAxgo.Fzpon67yOJjoArf9Yosy2tR5vF2zLd5fJ3tSglCuLoI");
// });

app.get('/', function(req, res) {
  res.redirect("/index");
});

// lang?id=106
// item?id=12304
// data?author=dyer&sort=desc
// lang?id=106&src=equivLiteral "1+2" "1+2" --> item id
app.get('/lang', function(req, res) {
  var id = req.query.id;
  var src = req.query.src;
  var lang = "L" + id;
  var type = req.query.type;
  console.log("GET /lang id=" + id + " src=" + src);
  if (src) {
    get(lang, "lexicon.js", function (err, data) {
      var lstr = data.substring(data.indexOf("{"));
      var lexicon = JSON.parse(lstr);
      var ast = main.parse(src, lexicon, function (err, ast) {
        console.log("GET /lang ast=" + JSON.stringify(ast));
        if (ast) {
          compile(0, 0, 0, lang, src, ast, null, null, {
            send: function (data) {
              if (type === "id") {
                res.send(data);
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
      console.log("GET /item version=" + version);
      res.render('views.html', {
        title: 'Graffiti Code',
        language: lang,
        vocabulary: lang,
        target: 'SVG',
        login: 'Login',
        item: 0,
        data: 0,
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

app.get('/item', function(req, res) {
  var ids = req.query.id.split(" ");
  var id = ids[0];  // First id is the item id.
  dbQuery("SELECT * FROM pieces WHERE id = " + id, function(err, result) {
    var rows;
    if (!result || result.rows.length===0) {
      rows = [{}];
    } else {
      var lang = result.rows[0].language;
      getCompilerVersion(lang, (version) => {
        console.log("GET /item version=" + version);
        res.render('views.html', {
          title: 'Graffiti Code',
          language: lang,
          vocabulary: lang,
          target: 'SVG',
          login: 'Login',
          item: ids[0],
          data: ids[1] ? ids[1] : 0,
          view: "item",
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
    dbQuery("UPDATE pieces SET views = views + 1 WHERE id = "+id, function () {
    });
  });
});

app.get('/form', function(req, res) {
  var ids = req.query.id.split(" ");
  var id = ids[0];  // First id is the item id.
  console.log("GET /form ids=" + ids);
  dbQuery("SELECT * FROM pieces WHERE id = " + id, function(err, result) {
    var rows;
    if (!result || result.rows.length===0) {
      rows = [{}];
    } else {
      var lang = result.rows[0].language;
      getCompilerVersion(lang, (version) => {
        console.log("GET /item version=" + version);
        res.render('form.html', {
          title: 'Graffiti Code',
          language: lang,
          vocabulary: lang,
          target: 'SVG',
          login: 'Login',
          item: ids[0],
          data: ids[1] ? ids[1] : 0,
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
    }
  });
  dbQuery("UPDATE pieces SET views = views + 1 WHERE id = " + id, ()=>{});
});

app.get('/data', function(req, res) {
  // If data id is supplied, then recompile with that data.
  let ids = req.query.id.split(" ");
  let codeId = ids[0];  // First id is the item id.
  let dataId = ids[1];
  console.log("GET /data ids=" + ids);
  dbQuery("SELECT * FROM pieces WHERE id = " + codeId, function(err, result) {
    var obj;
    if (err) {
      res.status(400).send(err);
    } else {
      if (!result || result.rows.length===0) {
        obj = [{}];
      } else {
        let row = result.rows[0];
        if (dataId) {
          // We have data so recompile with that data.
          let user = row.user_id;
          let parent = row.parent_id;
          let language = row.language;
          let src = row.src;
          let ast = row.ast;
          dbQuery("SELECT * FROM pieces WHERE id = " + dataId, (err, result) => {
            let data = JSON.parse(result.rows[0].obj)
            compile(codeId, user, parent, language, src, ast, data, null, res);
          });
        } else {
          // No data provided, so return previous object code.
          obj = JSON.parse(row.obj);
          res.send(obj);
        }
        dbQuery("UPDATE pieces SET views = views + 1 WHERE id = "+codeId, () => {});
      }
    }
  });
});

app.get("/index", function (req, res) {
  res.sendFile("public/index.html");
});

// Get an item with :id
app.get('/code/:id', function (req, res) {
  var id = req.params.id;
  dbQuery("SELECT * FROM pieces WHERE id = "+id, function(err, result) {
    var rows;
    if (!result || result.rows.length===0) {
      rows = [{}];
    } else {
      rows = result.rows;
    }
    res.send(rows);
    dbQuery("UPDATE pieces SET views = views + 1 WHERE id = "+id, function () {
    });
  });
});

// Get the object code for piece with :id
app.get('/graffiti/:id', function (req, res) {
  var id = req.params.id;
  dbQuery("SELECT obj, img FROM pieces WHERE id=" + id, function (err, result) {
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
    dbQuery("UPDATE pieces SET views = views + 1 WHERE id = "+id, function () {
    });
  });
});

// get list of piece ids
app.get('/pieces/:lang', function (req, res) {
  var lang = req.params.lang;
  var search = req.query.src;
  var label = req.query.label === undefined ? "show" : req.query.label;
  var queryString, likeStr = "";
  if (search) {
    var ss = search.split(",");
    ss.forEach(function (s) {
      s = cleanAndTrimSrc(s);
      if (likeStr) {
        likeStr += " AND ";
      } else {
        likeStr += "(";
      }
      likeStr += "src like '%" + s + "%'";
    });
    if (likeStr) {
      likeStr += ") AND ";
    }
  }
  queryString = "SELECT id FROM pieces WHERE language='" + lang +
    "' AND " + likeStr +
    "label = '" + label + "' ORDER BY id DESC";
  dbQuery(queryString, function (err, result) {
    var rows;
    if (!result || result.rows.length === 0) {
      console.log("no rows");
      var insertStr =
        "INSERT INTO pieces (user_id, parent_id, views, forks, created, src, obj, language, label, img)" +
        " VALUES ('" + 0 + "', '" + 0 + "', '" + 0 +
        " ', '" + 0 + "', now(), '" + "| " + lang + "', '" + "" +
        " ', '" + lang + "', '" + "show" + "', '" + "" + "');"
      dbQuery(insertStr, function(err, result) {
        if (err) {
          res.status(400).send(err);
          return;
        }
        dbQuery(queryString, function (err, result) {
          res.send(result.rows);
        });
      });
    } else {
      res.send(result.rows);
    }
  });
});

app.get('/items', function(req, res) {
  var data = "";
  req.on("data", function (chunk) {
    data += chunk;
  });
  req.on('end', function () {
    var list = JSON.parse(data);
    var queryStr =
      "SELECT id, created, src, obj, img FROM pieces WHERE id" +
      " IN ("+list+") ORDER BY id DESC";
    dbQuery(queryStr, function (err, result) {
      var rows;
      if (!result || result.rows.length === 0) {
        rows = [{}];
      } else {
        rows = result.rows;
      }
      res.send(rows)
    });
  });
  req.on('error', function(e) {
    console.log(e);
    res.send(e);
  });
});

app.get('/items/src', function(req, res) {
  var data = "";
  req.on("data", function (chunk) {
    data += chunk;
  });
  req.on('end', function () {
    var list = JSON.parse(data);
    var queryStr =
      "SELECT id, src FROM pieces WHERE id" +
      " IN ("+list+") ORDER BY id DESC";
    dbQuery(queryStr, function (err, result) {
      var rows;
      if (!result || result.rows.length === 0) {
        rows = [{}];
      } else {
        rows = result.rows;
      }
      res.send(rows);
    });
  });
  req.on('error', function(e) {
    console.log(e);
    res.send(e);
  });
});

// Get pieces
app.get('/code', function (req, res) {
  var list = req.query.list;
  var queryStr =
    "SELECT * FROM pieces WHERE pieces.id" +
    " IN ("+list+") ORDER BY pieces.id DESC";
  dbQuery(queryStr, function (err, result) {
    var rows;
    if (!result || result.rows.length === 0) {
      rows = [{}];
    } else {
      rows = result.rows;
    }
    res.send(rows)
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
        compilerVersions[language] = version;
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
  console.log("postItem user=" + user + " parent=" + parent);
  var queryStr =
    "INSERT INTO pieces (user_id, parent_id, views, forks, created, src, obj, language, label, img, ast)" +
    " VALUES ('" + user + "', '" + parent + "', '" + views +
    " ', '" + forks + "', now(), '" + src + "', '" + obj +
    " ', '" + language + "', '" + label + "', '" + img + "', '" + ast + "');"
  dbQuery(queryStr, function(err, result) {
    console.log("[1] postItem() result=" + JSON.stringify(result));
    if (err) {
      console.log("postItem() ERROR: " + err);
      resume(err);
    } else {
      var queryStr = "SELECT pieces.* FROM pieces ORDER BY pieces.id DESC LIMIT 1";
      dbQuery(queryStr, function (err, result) {
        console.log("[2] postItem() result=" + JSON.stringify(result));
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

function compile(id, user, parent, language, src, ast, data, rows, response) {
  // Compile ast to obj.
  var path = "/compile";
  var data = {
    "description": "graffiticode",
    "language": language,
    "src": ast,
    "data": data,
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
  var req = http.request(options, function(res) {
    var obj = "";
    res.on('data', function (chunk) {
      obj += chunk;
    });
    res.on('end', function () {
      console.log("compile() obj=" + obj);
      if (rows && rows.length === 1) {
        var o = rows[0].obj;
      }
      var rows = rows ? rows : [];
      if (rows.length === 0) {
        // We don't have an existing item with the same source, so add one.
        var img = "";
        var label = "show";
        // New item.
        postItem(language, src, ast, obj, user, parent, img, label, function (err, data) {
          if (err) {
            response.status(400).send(err);
          } else {
            response.send({
              obj: obj,
              id: data.rows[0].id
            });
          }
        });
      } else if (o !== obj || ast !== rows[0].ast) {
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
        response.send({
          obj: obj,
          id: id
        });
      } else {
        // No update needed. Just return the item.
        response.send({
          obj: rows[0].obj,
          id: rows[0].id
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

// Compile code (idempotent)
app.put('/compile', function (req, res) {
  // The AST is the key and the compiler is the map to the object code (OBJ).
  // PUT /compile does two things:
  // -- compile the given AST.
  // -- updates the object code of any items whose object code differs from the result.
  var id = req.body.id;
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
    // See if there is already an item with the same source for the same language. If so, pass it on.
    compile(id, user, parent, language, src, ast, null, result.rows, res);
  });
});

app.put('/code', function (req, response) {
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
      var id = req.body.id ? req.body.id : row.id;
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
      response.send({
        id: id
      });
    } else {
      var id = req.body.id;
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
          response.send({
            id: data.rows[0].id
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

// Get a label
app.get('/label', function (req, res) {
  var id = req.body.id;
  var label = "";
  dbQuery("SELECT label FROM pieces WHERE id = '" + id + "'",  function (err, result) {
    if (result || result.rows.length === 1) {
      label = result.rows[0].label;
    }
    res.send(label)
  });
});

// Update a label
app.put('/label', function (req, res) {
  var id = req.body.id;
  var label = req.body.label;
  dbQuery("UPDATE pieces SET label = '" + label + "' WHERE id = '" + id + "'", ()=>{});
  res.send(200)
});

app.get("/:lang/:path", function (req, res) {
  var language = req.params.lang;
  var path = req.params.path;
  retrieve(language, path, res);
});

// This is the new way of loading pages
app.get('/:lang', function (req, res) {
  var lang = req.params.lang.substring(1);
  if (!isNaN(parseInt(lang))) {
    res.redirect('/lang?id=' + lang);
  } else {
    res.status(400).send("Page not found");
  }
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
  var port = process.env.PORT || 3000;
  app.listen(port, function() {
    console.log("Listening on " + port);
  });
}
