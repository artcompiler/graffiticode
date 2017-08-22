/**
 * Module dependencies.
 */

function print(str) {
  console.log(str)
}

function assert(b, str) {
  if (!b) {
    throw new Error(str);
  }
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
var Hashids = require("hashids");


// Configuration

const LOCAL_COMPILES = true;
const LOCAL_DATABASE = false;

if (LOCAL_DATABASE) {
  pg.defaults.ssl = false;
} else {
  pg.defaults.ssl = true;
}
let conStrs = [
  LOCAL_DATABASE ? process.env.DATABASE_URL_LOCAL : process.env.DATABASE_URL,
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
    if (req.headers.host.match(/^www/) === null) {
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

let hashids = new Hashids("Art Compiler LLC");  // This string shall never change!
function decodeID(id) {
  // console.log("[1] decodeID() >> " + id);
  // 123456, 123+534653+0, Px4xO423c, 123+123456+0+Px4xO423c, Px4xO423c+Px4xO423c
  if (id === undefined) {
    id = "0";
  }
  if (Array.isArray(id)) {
    // Looks like it is already decoded.
    assert(Number.isInteger(id[0]) && Number.isInteger(id[1]));
    return id;
  }
  assert(typeof id === "string", "Invalid id " + id);
  id = id.replace(/\+/g, " ");
  let parts = id.split(" ");
  let ids = [];
  // Concatenate the first two integer ids and the last hash id. Everything
  // else gets erased.
  for (let i = 0; i < parts.length; i++) {
    let n;
    if (ids.length > 2) {
      // Found the head, now skip to the last part to get the tail.
      ids = ids.slice(0, 2);
      i = parts.length - 1;
    }
    if (Number.isInteger(n = +parts[i])) {
      ids.push(n);
    } else {
      ids = ids.concat(hashids.decode(parts[i]));
    }
  }
  // Fix short ids.
  if (ids.length === 1) {
    ids = [0, ids[0], 0];
  } else if (ids.length === 2) {
    ids = [0, ids[0], 113, ids[1], 0];
  } else if (ids.length === 3 && ids[2] !== 0) {
    ids = [ids[0], ids[1], 113, ids[2], 0];
  }
  // console.log("[2] decodeID() << " + JSON.stringify(ids));
  return ids;
}
function encodeID(ids) {
  // console.log("[1] encodeID() >> " + JSON.stringify(ids));
  if (ids.length === 1) {
    if (+ids[0] === 0) {
      // [0,0,0] --> "0"
      return "0";
    }
    ids = [0, +ids[0], 0];
  } else if (ids.length === 2) {
    ids = [0, +ids[0], 113, +ids[1], 0];
  }
  let id = hashids.encode(ids);
  // console.log("[2] encodeID() << " + id);
  return id;
}

// Routes

// http://stackoverflow.com/questions/10435407/proxy-with-express-js
var request = require('request');
app.get("/", (req, res) => {
  request("https://www.graffiticode.com/form?id=JeYHZ4PJux").pipe(res);
});

// get list of piece ids
app.get('/pieces/:lang', function (req, res) {
  var lang = req.params.lang;
  var search = req.query.src;
  var labelStr;
  if (req.query.label === undefined) {
    labelStr = " label='show' ";
  } else {
    let labels = req.query.label.split("|");
    labelStr = " (";
    labels.forEach(label => {
      if (labelStr !== " (") {
        labelStr += " OR ";
      }
      labelStr += " label='" + label + "' ";
    });
    labelStr += ") ";
  }
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
  queryString = "SELECT id, created FROM pieces WHERE language='" + lang +
    "' AND " + likeStr + labelStr + " ORDER BY id DESC";
  dbQuery(queryString, function (err, result) {
    var rows;
    if (!result || result.rows.length === 0) {
      console.log("no rows");
      // No rows for this language so make an empty item and insert it.
      var insertStr =
        "INSERT INTO pieces (user_id, parent_id, views, forks, created, src, obj, language, label, img)" +
        " VALUES ('" + 0 + "', '" + 0 + "', '" + 0 +
        " ', '" + 0 + "', now(), '" + "| " + lang + "', '" + "" +
        " ', '" + lang + "', '" + "show" + "', '" + "" + "');"
      dbQuery(insertStr, function(err, result) {
        if (err) {
          console.log("GET /pieces/:lang err=" + err);
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

app.get('/item', function(req, res) {
  const hasEditingRights = true;   // Compute based on authorization.
  if (hasEditingRights) {
    var ids = decodeID(req.query.id);
    console.log("GET /item?id=" + ids.join("+") + " (" + req.query.id + ")");
    var langID = ids[0];
    var codeID = ids[1];
    if (+langID !== 0) {
      let lang = "L" + langID;
      getCompilerVersion(lang, (version) => {
        res.render('views.html', {
          title: 'Graffiti Code',
          language: lang,
          item: encodeID(ids),
          view: "item",
          version: version,
        }, function (error, html) {
          if (error) {
            console.log("[1] GET /item err=" + error);
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
            item: encodeID(ids),
            view: "item",
            version: version,
          }, function (error, html) {
            if (error) {
              console.log("[2] GET /item err=" + error);
              res.status(400).send(error);
            } else {
              res.send(html);
            }
          });
        });
      });
    }
  } else {
    // Redirect to form view.
    let protocol;
    if (req.headers.host.match(/^localhost/) === null) {
      protocol = "https://";
    } else {
      protocol = "http://";
    }
    let url = [protocol, req.headers.host, req.url.replace("item", "form")].join('');
    res.redirect(url);
  }
});

// Get a label
app.get('/label', function (req, res) {
  let ids = decodeID(req.query.id);
  var langID = ids[0];
  let codeID = ids[1];
  var label = "";
  dbQuery("SELECT label FROM pieces WHERE id = '" + codeID + "'",  function (err, result) {
    if (result && result.rows.length === 1) {
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
      val.src = fixSingleQuotes(val.src);
      val.obj = fixSingleQuotes(val.obj);
    }
    resume(err, val);
  });
  dbQuery("UPDATE pieces SET views = views + 1 WHERE id = " + itemID, ()=>{});
};

const useCache = true;
const getCache = function (id, resume) {
  if (useCache) {
    cache.get(id, (err, val) => {
      resume(null, parseJSON(val));
    });
  } else {
    resume(null, null);
  }
};

const setCache = function (id, val) {
  if (useCache) {
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
  console.log("GET /lang?id=" + id);
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
          console.log("[1] GET /lang err=" + err);
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
          console.log("[2] GET /lang err=" + err);
          res.status(400).send(error);
        } else {
          res.send(html);
        }
      });
    });
  }
});

app.get('/form', function(req, res) {
  let ids = decodeID(req.query.id);
  console.log("GET /form?id=" + ids.join("+") + " (" + req.query.id + ")");
  let langID = ids[0] ? ids[0] : 0;
  let codeID = ids[1] ? ids[1] : 0;
  let dataID = ids[2] ? ids[2] : 0;
  if (!/[a-zA-Z]/.test(req.query.id)) {
    res.redirect("/form?id=" + encodeID(ids));
    return;
  }
  if (+langID !== 0) {
    let lang = "L" + langID;
    getCompilerVersion(lang, (version) => {
      res.render('form.html', {
        title: 'Graffiti Code',
        language: lang,
        item: encodeID(ids),
        view: "form",
        version: version,
      }, function (error, html) {
        if (error) {
          console.log("[1] GET /form err=" + error);
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
          item: encodeID(ids),
          view: "form",
          version: version,
        }, function (error, html) {
          if (error) {
            console.log("[2] GET /form error=" + error);
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
  let ids = decodeID(req.query.id);
  console.log("GET /data?id=" + ids.join("+") + " (" + req.query.id + ")");
  let langID = ids[0] ? ids[0] : 0;
  let codeID = ids[1] ? ids[1] : 0;
  let dataID = ids[2] ? ids[2] : 0;
  let hashID = encodeID(ids);
  // if (!/[a-zA-Z]/.test(req.query.id)) {
  //   res.redirect("/data?id=" + hashID);
  //   return;
  // }
  compileID(hashID, (err, obj) => {
    if (err) {
      console.log("GET /data err=" + err);
      res.status(400).send(err);
    } else {
      res.json(obj);
    }
  });
});

function fixSingleQuotes(str) {
  return str.replace(new RegExp("''", "g"), "'");
}

app.get('/code', (req, res) => {
  // Get the source code for an item.
  var ids = decodeID(req.query.id);
  console.log("GET /code?id=" + ids.join("+") + " (" + req.query.id + ")");
  var langID = ids[0];
  var codeID = ids[1];
  getItem(codeID, (err, row) => {
    // No data provided, so obj code won't change.
    res.json({
      id: codeID,
      src: fixSingleQuotes(row.src),
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
  // Compiler version tells which parser to use.
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

const nilID = encodeID([0,0,0]);
function getData(ids, resume) {
  if (encodeID(ids) === nilID || ids.length === 3 && +ids[2] === 0) {
    resume(null, {});
  } else {
    // Compile the tail.
    let id = encodeID(ids.slice(2));
    compileID(id, resume);
  }
}

function getCode(ids, resume) {
  getItem(ids[1], (err, item) => {
    // if L113 there is no AST.
    resume(err, item.ast);
  });
}

function getLang(ids, resume) {
  let id = ids[0];
  if (id !== 0) {
    resume(null, "L" + id);
  } else {
    getItem(ids[1], (err, item) => {
      resume(err, item.language);
    });
  }
}

function compileID(id, resume) {
  if (id === nilID) {
    resume(null, {});
  } else {
    getCache(id, (err, val) => {
      if (val) {
        // Got cached value. We're done.
        resume(err, val);
      } else {
        let ids = decodeID(id);
        getData(ids, (err, data) => {
          getCode(ids, (err, code) => {
            getLang(ids, (err, lang) => {
              if (lang === "L113" && Object.keys(data).length === 0) {
                // No need to recompile.
                getItem(ids[1], (err, item) => {
                  try {
                    resume(err, JSON.parse(fixSingleQuotes(item.obj)));
                  } catch (e) {
                    // Oops. Missing or invalid obj, so need to recompile after all.
                    assert(code.root !== undefined, "Invalid code.");
                    comp(lang, code, data, (err, obj) => {
                      setCache(id, obj);
                      resume(err, obj);
                    });
                  }
                });
              } else {
                comp(lang, code, data, (err, obj) => {
                  setCache(id, obj);
                  resume(err, obj);
                  if (Object.keys(data).length === 0) {
                    // If data is an empty object/array, update obj for code.
                    getItem(ids[1], (err, item) => {
                      updateItem(ids[1], lang, item.src, code, JSON.stringify(obj), item.user,
                                 item.parent, item.img, item.label, (err) => {});
                    });
                  }
                });
              }
            });
          });
        });
      }
    });
  }
}

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
        postItem(lang, src, ast, obj, user, 0, img, label, function (err, data) {
          if (err) {
            console.log("compile() err=" + err);
            response.status(400).send(err);
          } else {
            response.json({
              id: data.rows[0].id,  // only return the codeID
              obj: parseJSON(fixSingleQuotes(obj)),
            });
          }
        });
      } else if (rows.length === 1 && (rows[0].obj !== obj || rows[0].ast !== ast)) {
        var row = rows[0];
        id = id ? decodeID(id)[1] : row.id;
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
          obj: parseJSON(fixSingleQuotes(rows[0].obj)),
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
  let id = req.body.id;
  let ids = decodeID(id);
  let src = cleanAndTrimSrc(req.body.src);
  let ast = JSON.parse(req.body.ast);
  let language = req.body.language;
  let ip = req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
  let user = dot2num(ip); //req.body.user;
  let img = "";
  let obj = "";
  let label = "show";
  let parent = 0;
  let query;
  let itemID = id && +ids[1] !== 0 ? +ids[1] : undefined;
  if (itemID !== undefined) {
    // Prefer the given id if there is one.
    query = "SELECT * FROM pieces WHERE id='" + itemID + "'";
  } else {
    // Otherwise look for an item with matching source.
    query = "SELECT * FROM pieces WHERE language='" + language + "' AND src = '" + src + "' ORDER BY pieces.id";
  }
  dbQuery(query, function(err, result) {
    var row = result.rows[0];
    itemID = itemID ? itemID : row ? row.id : undefined;
    if (itemID) {
      let langID = language.charAt(0) === "L" ? +language.substring(1) : +language;
      let codeID = result.rows[0].id;
      let dataID = 0;
      let id = encodeID([langID, codeID, dataID]);
      // We have an id, so update the item record.
      updateItem(itemID, language, src, ast, obj, user, parent, img, label, (err) => {
        // Update the src and ast. In general, obj depends on data so don't save.
        if (err) {
          console.log("[1] PUT /compile err=" + err);
          res.status(400).send(err);
        } else {
          compileID(id, (err, obj) => {
            res.json({
              id: id,
              obj: obj,
            });
          });
        }
      });
    } else {
      postItem(language, src, ast, obj, user, parent, img, label, (err, result) => {
        if (err) {
          console.log("[2] PUT /compile err=" + err);
          response.status(400).send(err);
        } else {
          let langID = language.charAt(0) === "L" ? +language.substring(1) : +language;
          let codeID = result.rows[0].id;
          let dataID = 0;
          let id = encodeID([langID, codeID, dataID]);
          compileID(id, (err, obj) => {
            res.json({
              id: id,
              obj: obj,
            });
          });
        }
      });
    }
  });
});

app.put('/code', (req, response) => {
  let body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  let id = body.id;
  let ids = decodeID(id);
  let src = cleanAndTrimSrc(body.src);
  let language = body.language;
  let ip = req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
  let user = dot2num(ip); //body.user;
  let query;
  let itemID = id && +ids[1] !== 0 ? ids[1] : undefined;
  if (itemID !== undefined) {
    // Prefer the given id if there is one.
    query = "SELECT * FROM pieces WHERE id='" + itemID + "'";
  } else {
    // Otherwise look for an item with matching source.
    query = "SELECT * FROM pieces WHERE language='" + language + "' AND src = '" + src + "' ORDER BY pieces.id";
  }
  dbQuery(query, function(err, result) {
    // See if there is already an item with the same source for the same language. If so, pass it on.
    var row = result.rows[0];
    itemID = itemID ? itemID : row ? row.id : undefined;  // Might still be undefined if there is no match.
    if (itemID) {
      var language = row.language;
      var src = body.src ? body.src : row.src;
      var ast = body.ast ? JSON.parse(body.ast) : row.ast;
      var obj = body.obj ? body.obj : row.obj;
      //        var user = body.user_id ? body.user_id : row.user_id;
      var parent = body.parent_id ? body.parent_id : row.parent_id;
      var img = body.img ? body.img : row.img;
      var label = body.label ? body.label : row.label;
      updateItem(itemID, language, src, ast, obj, user, parent, img, label, function (err, data) {
        if (err) {
          console.log(err);
        }
      });
      // Don't wait for update. We have what we need to respond.
      let langID = language.charAt(0) === "L" ? +language.substring(1) : +language;
      let codeID = result.rows[0].id;
      let dataID = 0;
      let ids = [langID, codeID, dataID];
      let id = encodeID(ids);
      response.json({
        id: id,
      });
    } else {
      //var id = body.id;
      var src = body.src;
      var language = body.language;
      var ast = body.ast ? JSON.parse(body.ast) : {};  // Possibly undefined.
      var obj = body.obj;
      var label = body.label;
      var parent = 0;
      var img = "";
      postItem(language, src, ast, obj, user, parent, img, label, function (err, result) {
        let langID = language.charAt(0) === "L" ? +language.substring(1) : +language;
        let codeID = result.rows[0].id;
        let dataID = 0;
        let ids = [langID, codeID, dataID];
        let id = encodeID(ids);
        if (err) {
          console.log("PUT /code err=" + err);
          response.status(400).send(err);
        } else {
          response.json({
            id: id,
          });
        }
      });
    }
  });
});

app.get('/items', function(req, res) {
  // Used by L109, L131.
  let queryStr = "";
  if (req.query.list) {
    let list = req.query.list;
    queryStr =
      "SELECT * FROM pieces WHERE pieces.id" +
      " IN ("+list+") ORDER BY pieces.id DESC";
  } else if (req.query.where) {
    let fields = req.query.fields ? req.query.fields : "id";
    let limit = req.query.limit ? req.query.limit : "100";
    let where = req.query.where;
    queryStr =
      "SELECT " + fields +
      " FROM pieces WHERE " + where +
      " ORDER BY pieces.id DESC" +
      " LIMIT " + limit;
  } else {
    console.log("[1] GET /items err=" + err);
    send.status(400).send("bad request");
  }
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
    console.log("[2] GET /items err=" + err);
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

app.get("/:lang/*", function (req, res) {
  var lang = req.params.lang;
  let url = req.url;
  let path = url.substring(url.indexOf(lang) + lang.length + 1);
  retrieve(lang, path, res);
});

function getCompilerHost(language) {
  if (LOCAL_COMPILES && port === 3002) {
    return "localhost";
  } else {
    return language + ".artcompiler.com";
  }
}

function getCompilerPort(language) {
  if (LOCAL_COMPILES && port === 3002) {
    return "5" + language.substring(1);  // e.g. L103 -> 5103
  } else {
    return "80";
  }
}

app.get("/index", function (req, res) {
  res.sendFile("public/index.html");
});

// Get the object code for piece with :id
// app.get('/graffiti/:id', function (req, res) {
//   var id = req.params.id;
//   dbQuery("SELECT obj, img FROM pieces WHERE id=" + id, function (err, result) {
//     var ret;
//     if (!result || result.rows.length === 0) {
//       ret = "";
//     } else {
//       ret = result.rows[0].img;
//       if (!ret) {
//         // For backward compatibility
//         ret = result.rows[0].obj;
//       }
//     }
//     res.send(ret);
//     dbQuery("UPDATE pieces SET views = views + 1 WHERE id = "+id, function () {
//     });
//   });
// });

// This is the new way of loading pages
app.get('/:lang', function (req, res) {
  var lang = req.params.lang.substring(1);
  if (!isNaN(parseInt(lang))) {
    res.redirect('/lang?id=' + lang);
  } else {
    console.log("GET /:lang err");
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
  var port = process.env.PORT || 3002;
  app.listen(port, function() {
    console.log("Listening on " + port);
  });
}

