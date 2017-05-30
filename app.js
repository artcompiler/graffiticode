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
var errorHandler = require("errorhandler");
var timeout = require('connect-timeout');
var main = require('./main.js');
var pg = require('pg');
var Hashids = require("hashids");


// Configuration

//pg.defaults.ssl = true;
let conStrs = [
  process.env.DATABASE_URL_LOCAL,
//  process.env.DATABASE_URL,
];

function getConStr(id) {
  return conStrs[0];
}

var env = process.env.NODE_ENV || 'development';

let protocol = http; // Default. Set to http if localhost.

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
    protocol = http;
    next();
  }
});

app.set('views', __dirname + '/views');
app.set('public', __dirname + '/public');
app.use(morgan('combined', {
  skip: function (req, res) { return res.statusCode < 400 }
}));

app.use(bodyParser.urlencoded({ extended: false, limit: 10000000 }));
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

app.get('/', function(req, res) {
  res.redirect("/index");
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
    res.status(400).send(e);
  });
});

app.get('/item', function(req, res) {
  console.log("GET /item?id=" + req.query.id);
  var ids = decodeID(req.query.id);
  var langID = ids[0];
  var codeID = ids[1];
  var dataID = ids[2];
  if (+langID !== 0) {
    let lang = "L" + langID;
    getCompilerVersion(lang, (version) => {
      res.render('views.html', {
        title: 'Graffiti Code',
        language: lang,
        item: [langID, codeID, dataID].join("+"),
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
  } else {
    getItem(codeID, (err, row) => {
      var rows;
      var lang = row.language;
      getCompilerVersion(lang, (version) => {
        langID = lang.charAt(0) === "L" ? lang.substring(1) : lang;
        res.render('views.html', {
          title: 'Graffiti Code',
          language: lang,
          item: [langID, codeID, dataID].join("+"),
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
    });
  }
});

// Get a label
app.get('/label', function (req, res) {
  let ids = decodeID(req.body.id);
  var langID = ids[0];
  let itemID = ids[1];
  var label = "";
  dbQuery("SELECT label FROM pieces WHERE id = '" + itemID + "'",  function (err, result) {
    if (result || result.rows.length === 1) {
      label = result.rows[0].label;
    }
    res.send(label)
  });
});

// Update a label
app.put('/label', function (req, res) {
  let ids = decodeID(req.body.id);
  var langID = ids[0];
  let itemID = ids[1];
  var label = req.body.label;
  dbQuery("UPDATE pieces SET label = '" + label + "' WHERE id = '" + itemID + "'", ()=>{});
  res.send(200)
});

// BEGIN REUSE ORIGINAL

var dbQuery = function(query, resume) {
  let conString = getConStr(0);
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
        if (!result) {
          result = {
            rows: [],
          };
        }
        return resume(err, result);
      });
    } catch (e) {
      console.log("[2] dbQuery() e=" + e);
      done();
      return resume(e);
    }
  });
};

var getItem = function (itemID, resume) {
  dbQuery("SELECT * FROM pieces WHERE id = " + itemID, (err, result) => {
    // Here we get the language associated with the id. The code is gotten by
    // the view after it is loaded.
    let val;
    if (!result || result.rows.length === 0) {
      val = {};
    } else {
      //assert(result.rows.length === 1);
      val = result.rows[0];
    }
    resume(err, val);
  });
  dbQuery("UPDATE pieces SET views = views + 1 WHERE id = " + itemID, ()=>{});
};

const getCache = function (id, resume) {
  if (window.cache) {
    cache.get(id, (err, val) => {
      resume(null, parseJSON(val));
    });
  } else {
    resume(null, null);
  }
};

const setCache = function (id, val) {
  if (window.cache) {
    cache.set(id, JSON.stringify(val));
  }
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
  console.log("GET /lang id=" + id);
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
                res.json(data);
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
        item: undefined,
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
  console.log("GET /form?id=" + req.query.id);
  let ids = decodeID(req.query.id);
  let langID = ids[0] ? ids[0] : 0;
  let codeID = ids[1] ? ids[1] : 0;
  let dataID = ids[2] ? ids[2] : 0;
  if (!/[a-zA-Z]/.test(req.query.id)) {
    res.redirect("/form?id=" + encodeID([langID, codeID, dataID]));
    return;
  }
  if (langID !== 0) {
    let lang = "L" + langID;
    getCompilerVersion(lang, (version) => {
      res.render('form.html', {
        title: 'Graffiti Code',
        language: lang,
        item: encodeID([langID, codeID, dataID]),
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
  } else {
    getItem(codeID, function(err, row) {
      var lang = row.language;
      getCompilerVersion(lang, (version) => {
        langID = lang.charAt(0) === "L" ? lang.substring(1) : lang;
        res.render('form.html', {
          title: 'Graffiti Code',
          language: lang,
          item: encodeID([langID, codeID, dataID]),
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
  }
});

app.get('/data', function(req, res) {
  // If data id is supplied, then recompile with that data.
  console.log("GET /data?id=" + req.query.id);
  let ids = decodeID(req.query.id);
  let langID = ids[0] ? ids[0] : 0;
  let codeID = ids[1] ? ids[1] : 0;
  let dataID = ids[2] ? ids[2] : 0;
  let hashID = encodeID([langID, codeID, dataID]);
  if (!/[a-zA-Z]/.test(req.query.id)) {
    res.redirect("/data?id=" + hashID);
    return;
  }
  getCache(hashID, (err, val) => {
    if (val) {
      res.json(val);
    } else {
      getItem(codeID, function(err, item) {
        if (err) {
          res.status(400).send(err);
        } else {
          if (dataID) {
            // We have data so recompile with that data.
            let language = item.language;
            let ast = item.ast;
            getItem(dataID, (err, item) => {
              let data = JSON.parse(item.obj);
              comp(language, ast, data, (err, obj) => {
                res.json(obj);
                setCache(hashID, obj);
              });
            });
          } else {
            res.json(JSON.parse(item.obj));
            setCache(hashID, item.obj);
          }
        }
      });
    }
  });
});


let hashids = new Hashids("Art Compiler LLC");  // This string shall never change!
function decodeID(id) {
  id = id.replace(/\+/g, " ");
  // Return the three parts of an ID. Takes bare and hashed IDs.
  let ids;
  if (+id || id.split(" ").length > 1) {
    let a = id.split(" ");
    if (a.length === 1) {
      ids = [0, a[0], 0];
    } else if (a.length === 2) {
      ids = [0, a[0], a[1]];
    } else {
      ids = a;
    }
  } else {
    ids = hashids.decode(id);
  }
  return ids;
}
function encodeID(ids) {
  let langID, codeID, dataID;
  if (ids.length < 3) {
    ids.unshift(0);  // langID
  }
  let id = hashids.encode(ids);
  return id;
}
app.get('/code', (req, res) => {
  // Get the source code for an item.
  console.log("GET /code?id=" + req.query.id);
  var ids = decodeID(req.query.id);
  var langID = ids[0];
  var codeID = ids[1];
  getItem(codeID, (err, row) => {
    // No data provided, so obj code won't change.
    res.json({
      id: codeID,
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
  var req = protocol.get(options, function(res) {
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
    var req = protocol.get(options, function(res) {
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
  var req = protocol.get(options, function(res) {
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
  var req = protocol.request(options, function(res) {
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

function compile(id, user, parent, lang, src, ast, data, rows, response) {
  // Compile ast to obj.
  var path = "/compile";
  var encodedData = JSON.stringify({
    "description": "graffiticode",
    "language": lang,
    "src": ast,
    "data": data,
  });
  var options = {
    host: getCompilerHost(lang),
    port: getCompilerPort(lang),
    path: path,
    method: 'GET',
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': encodedData.length
    },
  };
  var req = protocol.request(options, function(res) {
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
        let ids = decodeID(parent);
        postItem(lang, src, ast, obj, user, ids[1], img, label, function (err, data) {
          if (err) {
            response.status(400).send(err);
          } else {
            response.json({
              id: data.rows[0].id,  // only return the codeID
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
        updateItem(id, lang, src, ast, obj, user, parent, img, label, function (err, data) {
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

app.get('/items', function(req, res) {
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
  req.on('error', function(e) {
    console.log(e);
    res.status(400).send(e);
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

// app.get("/:lang/:path", function (req, res) {
//   var language = req.params.lang;
//   var path = req.params.path;
//   console.log("GET /:lang/:path path=" + path);
//   retrieve(language, path, res);
// });

app.get("/:lang/*", function (req, res) {
  var lang = req.params.lang;
  let url = req.url;
  let path = url.substring(url.indexOf(lang) + lang.length + 1);
  retrieve(lang, path, res);
});

// END REUSE ORIGINAL

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

// Get an item with :id
app.get('/code/:id', (req, res) => {
  console.log("DEPRECATED GET /code/:id id=" + req.params.id);
  var ids = decodeID(req.params.id);
  var langID = ids[0];
  var codeID = ids[1];
  var dataID = ids[2];
  getItem(codeID, (err, row) => {
    if (dataID) {
      // We have data so recompile with that data.
      var src = row.src;
      var ast = row.ast;
      var parent = row.parent_id;
      var user = row.user_id;
      var language = row.language;
      getItem(dataID, (err, row) => {
        let data = JSON.parse(row.obj);
        compile(codeID, user, parent, language, src, ast, data, [row], res);
      });
    } else {
      // No data provided.
      res.send(row);
    }
  });
});

app.get("/index", function (req, res) {
  res.sendFile("public/index.html");
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

// This is the new way of loading pages
app.get('/:lang', function (req, res) {
  var lang = req.params.lang.substring(1);
  if (!isNaN(parseInt(lang))) {
    res.redirect('/lang?id=' + lang);
  } else {
    res.status(400).send("Page not found");
  }
});

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
  var port = process.env.PORT || 3000;
  app.listen(port, function() {
    console.log("Listening on " + port);
  });
}

