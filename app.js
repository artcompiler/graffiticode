/**
 * Module dependencies.
 */

function print(str) {
  process.stdout.write(str);
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
var cache = undefined; //redis.createClient(process.env.REDIS_URL);
var main = require('./main.js');
var Hashids = require("hashids");

// const expressJWT = require("express-jwt");
// const jwt = require("jsonwebtoken");
// const jwtSecret = "Artcompiler LLC"
// app.use(expressJWT({secret: jwtSecret}).unless(["/login"]));
// app.get("/login", (req, res) => {
//   if (auth) {
//     let token = jwt.sign({
//       user: "foobar"
//     }, jwtSecret);
//     res.json(token);
//   } else {
//     res.send(401).send("Invalid credentials");
//   }
// });

// Configuration

const DEBUG = false;
const LOCAL_COMPILES = true;
const LOCAL_DATABASE = false;

if (LOCAL_DATABASE) {
  pg.defaults.ssl = false;
} else {
  pg.defaults.ssl = true;
}

const conStrs = [
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
  res.sendStatus(500).send('Something broke!')
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
  if (Number.isInteger(id)) {
    id = "" + id;
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
  let length = ids.length;
  if (length >= 3 &&
      // [0,0,0] --> "0"
      +ids[length - 3] === 0 &&
      +ids[length - 2] === 0 &&
      +ids[length - 1] === 0) {
    ids = ids.slice(0, length - 2);
    length = ids.length;
  }
  if (length === 1) {
    if (+ids[0] === 0) {
      return "0";
    }
    ids = [0, +ids[0], 0];
  } else if (length === 2) {
    ids = [0, +ids[0], 113, +ids[1], 0];
  }
  let id = hashids.encode(ids);
  // console.log("[2] encodeID() << " + id);
  return id;
}

// Routes

app.get('/', function(req, res) {
  res.redirect("public/index.html");
});

app.get('/item', function(req, res) {
  const hasEditingRights = true;   // Compute based on authorization.
  if (hasEditingRights) {
    var ids = decodeID(req.query.id);
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
          refresh: req.query.refresh,
        }, function (error, html) {
          if (error) {
            console.log("ERROR [1] GET /item err=" + error);
            res.sendStatus(400).send(error);
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
            refresh: req.query.refresh,
          }, function (error, html) {
            if (error) {
              console.log("ERROR [2] GET /item err=" + error);
              res.sendStatus(400).send(error);
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

const updateLabel = function(id, label, resume) {
  dbQuery("UPDATE pieces SET label = '" + label + "' WHERE id = '" + id + "'", () => {
    if (resume) {
      resume();
    }
    return;
  });
};

// Update a label
app.put('/label', function (req, res) {
  let ids = decodeID(req.body.id);
  var langID = ids[0];
  let itemID = ids[1];
  var label = req.body.label;
  dbQuery("UPDATE pieces SET label = '" + label + "' WHERE id = '" + itemID + "'", ()=>{});
  res.send(200)
});

const dbQuery = function(query, resume) {
  let conString = getConStr(0);
  // Query Helper -- https://github.com/brianc/node-postgres/issues/382
  pg.connect(conString, function (err, client, done) {
    // If there is an error, client is null and done is a noop
    if (err) {
      console.log("ERROR [1] dbQuery() err=" + err);
      return resume(err, {});
    }
    try {
      client.query(query, function (err, result) {
        done();
        if (err) {
          throw new Error(err);
        }
        if (!result) {
          result = {
            rows: [],
          };
        }
        return resume(err, result);
      });
    } catch (e) {
      console.log("ERROR [2] dbQuery() e=" + e);
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

const localCache = {};
const delCache = function (id) {
  delete localCache[id];
  if (cache) {
    cache.del(id);
  }
};
const getCache = function (id, resume) {
  let val;
  if ((val = localCache[id])) {
    resume(null, val);
  } else if (cache) {
    cache.get(id, (err, val) => {
      resume(null, parseJSON(val));
    });
  } else {
    resume(null, null);
  }
};
const dontCache = ["L124"];
const setCache = function (lang, id, val) {
  if (!DEBUG && !dontCache.includes(lang)) {
    localCache[id] = val;
    if (cache) {
      cache.set(id, JSON.stringify(val));
    }
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

const lexiconCache = {};
function parse(lang, src, resume) {
  let lexicon;
  if ((lexicon = lexiconCache[lang])) {
    main.parse(src, lexicon, resume);
  } else {
    get(lang, "lexicon.js", function (err, data) {
      const lstr = data.substring(data.indexOf("{"));
      lexicon = JSON.parse(lstr);
      lexiconCache[lang] = lexicon;
      main.parse(src, lexicon, resume);
    });
  }
}

app.get('/lang', function(req, res) {
  // lang?id=106
  var id = req.query.id;
  var src = req.query.src;
  var lang = "L" + id;
  if (src) {
    assert(false, "Should not get here. Call PUT /compile");
  } else {
    getCompilerVersion(lang, (version) => {
      res.render('views.html', {
        title: 'Graffiti Code',
        language: lang,
        item: undefined,
        version: version,
        refresh: req.query.refresh,
      }, function (error, html) {
        if (error) {
          console.log("ERROR [2] GET /lang err=" + err);
          res.sendStatus(400).send(error);
        } else {
          res.send(html);
        }
      });
    });
  }
});

app.get('/form', function(req, res) {
  let ids = decodeID(req.query.id);
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
        refresh: req.query.refresh,
      }, function (error, html) {
        if (error) {
          console.log("ERROR [1] GET /form err=" + error);
          res.sendStatus(400).send(error);
        } else {
          res.send(html);
        }
      });
    });
  } else {
    // Don't have a langID, so get it from the database item.
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
          refresh: req.query.refresh,
        }, function (error, html) {
          if (error) {
            console.log("ERROR [2] GET /form error=" + error);
            res.sendStatus(400).send(error);
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
  let langID = ids[0] ? ids[0] : 0;
  let codeID = ids[1] ? ids[1] : 0;
  let dataIDs = ids[2] ? ids.slice(2) : 0;
  let id = encodeID([langID, codeID].concat(dataIDs));
  let refresh = !!req.query.refresh;
  let t0 = new Date;
  compileID(id, refresh, (err, obj) => {
    if (err) {
      console.log("ERROR GET /data err=" + err);
      res.sendStatus(400).send(err);
    } else {
      console.log("GET /data?id=" + ids.join("+") + " (" + req.query.id + ") in " +
                  (new Date - t0) + "ms" + (refresh ? " [refresh]" : ""));
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
      console.log("ERROR postItem() " + queryStr);
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
    "parent_id='" + parent + "', " +
    "src='" + src + "', " +
    "ast='" + ast + "', " +
    "obj='" + obj + "' " +
    "WHERE id='" + id + "'";
  dbQuery(query, function (err) {
    resume(err, []);
  });
};

function updateAST(id, ast, resume) {
  ast = cleanAndTrimSrc(JSON.stringify(ast));
  var query =
    "UPDATE pieces SET " +
    "ast='" + ast + "' " +
    "WHERE id='" + id + "'";
  dbQuery(query, function (err) {
    if (err && err.length) {
      console.log("ERROR updateAST() err=" + err);
    }
    resume(err, []);
  });
}

function updateOBJ(id, obj, resume) {
  obj = cleanAndTrimObj(JSON.stringify(obj));
  var query =
    "UPDATE pieces SET " +
    "obj='" + obj + "' " +
    "WHERE id='" + id + "'";
  dbQuery(query, function (err) {
    resume(err, []);
  });
}

const nilID = encodeID([0,0,0]);
function getData(ids, refresh, resume) {
  if (encodeID(ids) === nilID || ids.length === 3 && +ids[2] === 0) {
    resume(null, {});
  } else {
    // Compile the tail.
    let id = encodeID(ids.slice(2));
    compileID(id, refresh, resume);
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

function compileID(id, refresh, resume) {
  if (id === nilID) {
    resume(null, {});
  } else {
    if (refresh) {
      delCache(id);
    }
    getCache(id, (err, val) => {
      if (val) {
        // Got cached value. We're done.
        resume(err, val);
      } else {
        let ids = decodeID(id);
        getData(ids, refresh, (err, data) => {
          getCode(ids, (err, code) => {
            getLang(ids, (err, lang) => {
              if (lang === "L113" && Object.keys(data).length === 0) {
                // No need to recompile.
                getItem(ids[1], (err, item) => {
                  try {
                    let obj = JSON.parse(fixSingleQuotes(item.obj));
                    setCache(lang, id, obj);
                    resume(err, obj);
                  } catch (e) {
                    // Oops. Missing or invalid obj, so need to recompile after all.
                    // Let downstream compilers they need to refresh
                    // any data used. Prefer true over false.
                    comp(lang, code, data, refresh, (err, obj) => {
                      setCache(lang, id, obj);
                      resume(err, obj);
                    });
                  }
                });
              } else {
                if (lang && code) {
                  assert(code.root !== undefined, "Invalid code.");
                  // Let downstream compilers they need to refresh
                  // any data used.
                  comp(lang, code, data, refresh, (err, obj) => {
                    setCache(lang, id, obj);
                    resume(err, obj);
                  });
                } else {
                  // Error handling here.
                  console.log("ERROR compileID() ids=" + ids + " missing code");
                  resume(null, {});
                }
              }
            });
          });
        });
      }
    });
  }
}

function comp(lang, code, data, refresh, resume) {
  // Compile ast to obj.
  var path = "/compile";
  var encodedData = JSON.stringify({
    "description": "graffiticode",
    "language": lang,
    "src": code,
    "data": data,
    "refresh": refresh,
    "auth": authToken,
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

const parseID = (id, resume) => {
  let ids = decodeID(id);
  getItem(ids[1], (err, item) => {
    // if L113 there is no AST.
    const lang = item.language;
    const src = item.src;
    if (src) {
      parse(lang, src, (err, ast) => {
        if (!ast || Object.keys(ast).length === 0) {
          console.log("NO AST for SRC " + src);
        }
        if (JSON.stringify(ast) !== JSON.stringify(item.ast)) {
          print("*");
          updateAST(id, ast, (err)=>{
            assert(!err);
            resume(err, ast);
          });
        } else {
          resume(err, ast);
        }
      });
    } else {
      resume(["ERROR no source. " + id]);
    }
  });
};

const recompileItems = (items, parseOnly) => {
  items.forEach(id => {
    parseID(id, (err, ast) => {
      print(id + " parsed");
      if (err.length) {
        console.log("ERROR " + err);
        return;
      }
      if (!parseOnly) {
        compileID(id, true, (err, obj) => {
          print(" compiled\n");
          updateOBJ(id, obj, (err)=>{ assert(!err) });
        });
      } else {
        print("\n");
      }
    });
  });
};

app.put('/compile', function (req, res) {
  let t0 = new Date;
  // Compile AST or SRC to OBJ. Insert or add item.
  let id = req.body.id;
  let ids = decodeID(id);
  let rawSrc = req.body.src;
  let src = cleanAndTrimSrc(req.body.src);
  let ast = req.body.ast;
  let lang = req.body.language;
  let ip = req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
  let user = dot2num(ip);  // Use IP address for user for now.
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
    query = "SELECT * FROM pieces WHERE language='" + lang + "' AND src = '" + src + "' ORDER BY pieces.id";
  }
  dbQuery(query, function(err, result) {
    var row = result.rows[0];
    itemID = itemID ? itemID : row ? row.id : undefined;
    ast = ast ? JSON.parse(ast) : row && row.ast ? row.ast : null;
    if (!ast) {
      parse(lang, rawSrc, (err, ast) => {
        compile(ast);
      });
    } else {
      compile(ast);
    }
    function compile(ast) {
      if (itemID) {
        let langID = lang.charAt(0) === "L" ? +lang.substring(1) : +lang;
        let codeID = row.id;
        let dataID = 0;
        let ids = [langID, codeID, dataID];
        let id = encodeID(ids);
        // We have an id, so update the item with the current AST.
        updateItem(itemID, lang, src, ast, obj, user, parent, img, label, (err) => {
          // Update the src and ast because they are used by compileID().
          if (err) {
            console.log("ERROR [1] PUT /compile err=" + err);
            res.sendStatus(400).send(err);
          } else {
            compileID(id, false, (err, obj) => {
              console.log("PUT /comp?id=" + ids.join("+") + " (" + id + ") in " +
                          (new Date - t0) + "ms");
              updateOBJ(codeID, obj, (err)=>{ assert(!err) });
              res.json({
                id: id,
                obj: obj,
              });
            });
          }
        });
      } else {
        postItem(lang, src, ast, obj, user, parent, img, label, (err, result) => {
          if (err) {
            console.log("ERROR [2] PUT /compile err=" + err);
            response.sendStatus(400).send(err);
          } else {
            let langID = lang.charAt(0) === "L" ? +lang.substring(1) : +lang;
            let codeID = result.rows[0].id;
            let dataID = 0;
            let ids = [langID, codeID, dataID];
            let id = encodeID(ids);
            compileID(id, false, (err, obj) => {
              console.log("PUT* /comp?id=" + ids.join("+") + " (" + id + ") in " +
                          (new Date - t0) + "ms");
              updateOBJ(codeID, obj, (err)=>{ assert(!err) });
              res.json({
                id: id,
                obj: obj,
              });
            });
          }
        });
      }
    }
  });
});

app.put('/code', (req, response) => {
  // Insert or update with given values.
  let t0 = new Date;
  let body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  let id = body.id;
  let ids = decodeID(id);
  let src = cleanAndTrimSrc(body.src);
  let lang = body.language;
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
    query = "SELECT * FROM pieces WHERE language='" + lang + "' AND src = '" + src + "' ORDER BY pieces.id";
  }
  dbQuery(query, function(err, result) {
    // See if there is already an item with the same source for the same
    // language. If so, pass it on.
    var row = result.rows[0];
    itemID = itemID ? itemID : row ? row.id : undefined;
    // Might still be undefined if there is no match.
    if (itemID) {
      var lang = row.language;
      var src = body.src ? body.src : row.src;
      var ast = body.ast ? JSON.parse(body.ast) : row.ast;
      var obj = body.obj ? body.obj : row.obj;
      // var user = body.user_id ? body.user_id : row.user_id;
      var parent = body.parent_id ? body.parent_id : row.parent_id;
      var img = body.img ? body.img : row.img;
      var label = body.label ? body.label : row.label;
      updateItem(itemID, lang, src, ast, obj, user, parent, img, label, function (err, data) {
        if (err) {
          console.log("ERROR " + err);
        }
      });
      // Don't wait for update. We have what we need to respond.
      let langID = lang.charAt(0) === "L" ? +lang.substring(1) : +lang;
      let codeID = result.rows[0].id;
      let dataID = 0;
      let ids = [langID, codeID, dataID];
      let id = encodeID(ids);
      // console.log("PUT /code?id=" + ids.join("+") + " (" + id + ") in " +
      //             (new Date - t0) + "ms");
      response.json({
        id: id,
      });
    } else {
      var src = body.src;
      var lang = body.language;
      var ast = body.ast ? JSON.parse(body.ast) : null;  // Possibly undefined.
      var obj = body.obj;
      var label = body.label;
      var parent = body.parent_id ? body.parent_id : 0;
      var img = "";
      postItem(lang, src, ast, obj, user, parent, img, label, (err, result) => {
        let langID = lang.charAt(0) === "L" ? +lang.substring(1) : +lang;
        let codeID = result.rows[0].id;
        let dataID = 0;
        let ids = [langID, codeID, dataID];
        let id = encodeID(ids);
        if (err) {
          console.log("ERROR PUT /code err=" + err);
          response.sendStatus(400).send(err);
        } else {
          console.log("PUT* /code?id=" + ids.join("+") + " (" + id + ") in " +
                      (new Date - t0) + "ms");
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
    let limit = req.query.limit ? req.query.limit : "1000";
    let where = req.query.where;
    queryStr =
      "SELECT " + fields +
      " FROM pieces WHERE " + where +
      " ORDER BY pieces.id DESC" +
      (limit ? " LIMIT " + limit : "");
  } else {
    console.log("ERROR [1] GET /items err=" + err);
    res.sendStatus(400).send("bad request");
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
    console.log("ERROR " + e);
    console.log("ERROR [2] GET /items err=" + err);
    res.sendStatus(400).send(e);
  });
});

// DECPRECATE replace with GET /items {fields: "id", where: "language='L106' and ..."}
app.get('/pieces/:lang', function (req, res) {
  // Get list of item ids that match a query.
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
          console.log("ERROR GET /pieces/:lang err=" + err);
          res.sendStatus(400).send(err);
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

app.get("/:lang/*", function (req, response) {
  // /L106/lexicon.js
  var lang = req.params.lang;
  let url = req.url;
  let path = url.substring(url.indexOf(lang) + lang.length + 1);
  var data = [];
  var options = {
    host: getCompilerHost(lang),
    port: getCompilerPort(lang),
    path: "/" + path,
  };
  var req = protocol.get(options, function(res) {
    res.on("data", function (chunk) {
      data.push(chunk);
    }).on("end", function () {
      response.send(data.join(""));
    });
  });
});

function getCompilerHost(lang) {
  if (LOCAL_COMPILES && port === 3000) {
    return "localhost";
  } else {
    return lang + ".artcompiler.com";
  }
}

function getCompilerPort(lang) {
  if (LOCAL_COMPILES && port === 3000) {
    return "5" + lang.substring(1);  // e.g. L103 -> 5103
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
  console.log('ERROR Caught exception: ' + err.stack);
});

function postAuth(path, data, resume) {
  let encodedData = JSON.stringify(data);
  var options = {
    host: "auth.artcompiler.com",
    port: "443",
    path: path,
    method: "POST",
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(encodedData),
    },
  };
  var req = https.request(options);
  req.on("response", (res) => {
    var data = "";
    res.on('data', function (chunk) {
      data += chunk;
    }).on('end', function () {
      try {
        resume(null, JSON.parse(data));
      } catch (e) {
        console.log("ERROR " + data);
        console.log(e.stack);
      }
    }).on("error", function () {
      console.log("error() status=" + res.statusCode + " data=" + data);
    });
  });
  req.end(encodedData);
  req.on('error', function(err) {
    console.log("ERROR " + err);
    resume(err);
  });
}

let authToken;

if (!module.parent) {
  var port = process.env.PORT || 3000;
  app.listen(port, function() {
    console.log("Listening on " + port);
    postAuth("/login", {
      "address": "0x0123456789abcdef0123456789abcdef01234567"
    }, (err, data) => {
      postAuth("/finishLogin", {
        "jwt": data.jwt,
      }, (err, data) => {
        authToken = data.jwt;
      });
    });
    recompileItems([]);
  });
}

