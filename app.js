const assert = require('assert');
const express = require('express');
const _ = require('underscore');
const fs = require('fs');
const http = require('http');
const https = require('https');
const app = module.exports = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const errorHandler = require("errorhandler");
const pg = require('pg');
const redis = require('redis');
const cache = undefined; // = redis.createClient(process.env.REDIS_URL);
const atob = require("atob");
const {decodeID, encodeID} = require('./src/id');
const main = require('./src/main');
const routes = require('./routes');

// Configuration
const DEBUG = process.env.DEBUG === 'true' || false;
const LOCAL_COMPILES = process.env.LOCAL_COMPILES === 'true' || false;
const LOCAL_DATABASE = process.env.LOCAL_DATABASE === 'true' || false;

if (LOCAL_DATABASE) {
  pg.defaults.ssl = false;
} else {
  pg.defaults.ssl = true;
}

const conStrs = [
  LOCAL_DATABASE ? process.env.DATABASE_URL_LOCAL
    : DEBUG ? process.env.DATABASE_URL_DEV
    : process.env.DATABASE_URL,
];

function getConStr(id) {
  return conStrs[0];
}

const env = process.env.NODE_ENV || 'development';

let protocol = http;

app.all('*', function (req, res, next) {
  if (req.headers.host.match(/^localhost/) === null) {
    if (req.headers['x-forwarded-proto'] !== 'https' && env === 'production') {
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
// app.set('public', __dirname + '/public');
// app.set('public', __dirname + '/lib');
app.use(morgan('combined', {
  skip: function (req, res) { return res.statusCode < 400 }
}));

app.use(bodyParser.urlencoded({ extended: false, limit: 100000000 }));
app.use(bodyParser.text({limit: '50mb'}));
app.use(bodyParser.raw({limit: '50mb'}));
app.use(bodyParser.json({ type: 'application/vnd.api+json', limit: '50mb' }));
app.use(methodOverride());
app.use(express.static(__dirname + '/public'));
app.use('/lib', express.static(__dirname + '/lib'));
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.sendStatus(500);
});
app.engine('html', function (templateFile, options, callback) {
  fs.readFile(templateFile, function (err, templateData) {
    var template = _.template(String(templateData));
    callback(err, template(options))
  });
});

// Routes

var request = require('request');
app.get("/", (req, res) => {
  let proto = req.headers['x-forwarded-proto'] || "http";
  if (aliases["home"]) {
    request([proto, "://", req.headers.host, "/form?id=" + aliases["home"]].join("")).pipe(res);
  } else {
    request([proto, "://", req.headers.host, "/form?id=q1yU91wYFN"].join("")).pipe(res);
  }
});

const aliases = {};

function insertItem(userID, itemID, resume) {
  dbQuery("SELECT count(*) FROM items where userID=" + userID + "AND itemID='" + itemID + "'", (err, result) => {
    if (+result.rows[0].count === 0) {
      let [langID, codeID, ...dataID] = decodeID(itemID);
      dataID = encodeID(dataID);
      dbQuery("INSERT INTO items (userID, itemID, langID, codeID, dataID) " +
              "VALUES (" + userID + ", '" + itemID + "', " + langID + ", " + codeID + ", '" + dataID + "') ",
              (err, result) => {
                 resume();
              });
    } else {
      resume();
    }
  });
}

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
          throw new Error(err + ": " + query);
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

const getItem = function (itemID, resume) {
  dbQuery("SELECT * FROM pieces WHERE id = " + itemID, (err, result) => {
    // Here we get the language associated with the id. The code is gotten by
    // the view after it is loaded.
    let val;
    if (!result || !result.rows || result.rows.length === 0 || result.rows[0].id < 1000) {
      // Any id before 1000 was experimental
      resume("Bad ID", null);
    } else {
      //assert(result.rows.length === 1);
      val = result.rows[0];
      resume(err, val);
    }
  });
};

const localCache = {};
const delCache = function (id, type) {
  let key = id + type;
  delete localCache[key];
  if (cache) {
    cache.del(key);
  }
};
const renCache = function (id, oldType, newType) {
  let oldKey = id + oldType;
  let newKey = id + newType;
  localCache[newKey] = localCache[oldKey];
  delete localCache[oldKey];
  if (cache) {
    cache.rename(oldKey, newKey);
  }
};
const getKeys = (filter, resume) => {
  filter = filter || "*";
  cache.keys(filter, resume);
};
const getCache = function (id, type, resume) {
  let key = id + type;
  let val;
  if ((val = localCache[key])) {
    resume(null, val);
  } else if (cache) {
    cache.get(key, (err, val) => {
      resume(null, type === "data" ? parseJSON(val) : val);
    });
  } else {
    resume(null, null);
  }
};
const dontCache = ["L124"];
const setCache = function (lang, id, type, val) {
  if (!DEBUG && !dontCache.includes(lang)) {
    let key = id + type;
    localCache[key] = val;
    if (cache) {
      cache.set(key, type === "data" ? JSON.stringify(val) : val);
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

app.use('/label', routes.label(dbQuery));
app.use('/stat', routes.stat(dbQuery, insertItem));

app.get('/lang', function(req, res) {
  // lang?id=106
  var id = req.query.id;
  let langID = id;
  var src = req.query.src;
  var lang = langName(langID);
  pingLang(lang, (pong) => {
    if (pong) {
      if (src) {
        assert(false, "Should not get here. Call PUT /compile");
      } else {
        let queryString = "SELECT id FROM pieces WHERE language='" + lang + "' ORDER BY id DESC";
        dbQuery(queryString, (err, result) => {
          let rows = result.rows;
          if (rows.length === 0) {
            var insertStr =
              "INSERT INTO pieces (user_id, parent_id, views, forks, created, src, obj, language, label, img)" +
              " VALUES ('" + 0 + "', '" + 0 + "', '" + 0 +
              " ', '" + 0 + "', now(), '" + "| " + lang + "', '" + "" +
              " ', '" + lang + "', '" + "show" + "', '" + "" + "');"
            dbQuery(insertStr, function(err, result) {
              if (err) {
                console.log("ERROR GET /pieces/:lang err=" + err);
                res.sendStatus(400);
                return;
              }
              dbQuery(queryString, (err, result) => {
                let rows = result.rows;
                if (rows.length > 0) {
                  res.redirect("/form?id=" + rows[0].id);
                } else {
                  console.log("[1] GET /lang ERROR 404 ");
                  res.sendStatus(404);
                }
              });
            });
          } else {
            res.redirect("/item?id=" + encodeID([langID, rows[0].id, 0]));
          }
        });
      }
    } else {
      res.sendStatus(404);
      return false;
    }
  });
});

const sendItem = (id, req, res) => {
  if (req.query.alias) {
    aliases[req.query.alias] = id;
  }
  let ids = decodeID(id);
  if (ids[1] === 0 && aliases[id]) {
    // ID is an invalid ID but a valid alias, so get aliased ID.
    ids = decodeID(aliases[id]);
  }
  // If forkID then getTip()
  getTip(id, (err, tip) => {
    let langID = ids[0];
    let codeID = tip || ids[1];
    let dataIDs = ids.slice(2);
    if (req.query.fork) {
      // Create a new fork.
      getItem(codeID, (err, row) => {
        if (err && err.length) {
          console.log("[1] GET /item ERROR 404 ");
          res.sendStatus(404);
        } else {
          langID = langID || +row.language.slice(1);
          let language = "L" + langID;
          let src = row.src;
          let ast = row.ast;
          let obj = row.obj;
          let userID = row.user_id;
          let parentID = codeID;
          let img = row.img;
          let label = row.label;
          let forkID = 0;
          postItem(language, src, ast, obj, userID, parentID, img, label, forkID, (err, result) => {
            let codeID = result.rows[0].id;
            let ids = [langID, codeID].concat(dataIDs);
            if (err) {
              console.log("ERROR putData() err=" + err);
              resume(err);
            } else {
              res.render('views.html', {
                title: 'Graffiti Code',
                language: language,
                item: encodeID(ids),
                view: "item",
                refresh: req.query.refresh,
                archive: req.query.archive,
                showdata: req.query.data,
                forkID: codeID,
                findLabel: req.query.label,
                findMark: req.query.mark,
              }, function (error, html) {
                if (error) {
                  console.log("ERROR [1] GET /item err=" + error);
                  res.sendStatus(400);
                } else {
                  res.send(html);
                }
              });
            }
          });
        }
      });
    } else {
      getItem(codeID, (err, row) => {
        if (err && err.length) {
          console.log("ERROR [1] GET /item");
          res.sendStatus(404);
        } else {
          let rows;
          langID = langID || +row.language.slice(1);
          let language = "L" + langID;
          res.render('views.html', {
            title: 'Graffiti Code',
            language: language,
            item: encodeID([langID, codeID].concat(dataIDs)),
            view: "item",
            refresh: req.query.refresh,
            archive: req.query.archive,
            showdata: req.query.data,
            forkID: row.fork_id,
            findLabel: req.query.label,
            findMark: req.query.mark,
          }, function (error, html) {
            if (error) {
              console.log("ERROR [2] GET /item err=" + error);
              res.sendStatus(400);
            } else {
              res.send(html);
            }
          });
        }
      });
    }
  });
};

app.get("/item", function (req, res) {
  sendItem(req.query.id, req, res);
});

// app.get("/i/:id", function (req, res) {
//   sendItem(req.params.id, req, res);
// });

const sendForm = (id, req, res) => {
  let ids = decodeID(id);
  if (ids[1] === 0 && aliases[id]) {
    // ID is an invalid ID but a valid alias, so get aliased ID.
    ids = decodeID(aliases[id]);
  }
  let langID = ids[0] ? ids[0] : 0;
  let codeID = ids[1] ? ids[1] : 0;
  if (codeID === 0) {
    console.log("ERROR [1] GET /form id=" + id + " ids=" + ids.join("+"));
    res.sendStatus(404);
    return;
  }
  if (!/[a-zA-Z]/.test(id)) {
    res.redirect("/form?id=" + encodeID(ids));
    return;
  }
  if (langID !== 0) {
    let lang = langName(langID);
    res.render('form.html', {
      title: 'Graffiti Code',
      language: lang,
      item: encodeID(ids),
      view: "form",
      refresh: req.query.refresh,
    }, function (error, html) {
      if (error) {
        console.log("ERROR [1] GET /form err=" + error);
        res.sendStatus(400);
      } else {
        res.send(html);
      }
    });
  } else {
    // Don't have a langID, so get it from the database item.
    getItem(codeID, function(err, row) {
      if (!row) {
        console.log("ERROR [2] GET /form");
        res.sendStatus(404);
      } else {
        var lang = row.language;
        langID = lang.charAt(0) === "L" ? lang.substring(1) : lang;
        res.render('form.html', {
          title: 'Graffiti Code',
          language: lang,
          item: encodeID(ids),
          view: "form",
          refresh: req.query.refresh,
        }, function (error, html) {
          if (error) {
            console.log("ERROR [2] GET /form error=" + error);
            res.sendStatus(400);
          } else {
            res.send(html);
          }
        });
      }
    });
  }
};

app.get("/form", function (req, res) {
  sendForm(req.query.id, req, res);
});

// app.get("/f/:id", function (req, res) {
//   sendForm(req.params.id, req, res);
// });

const sendData = (auth, id, req, res) => {
  let ids = decodeID(id);
  let refresh = !!req.query.refresh;
  let dontSave = !!req.query.dontSave;
  let options = {
    refresh: refresh,
    dontSave: dontSave,
  };
  let t0 = new Date;
  compileID(auth, id, options, (err, obj) => {
    if (err) {
      console.log("ERROR GET /data?id=" + ids.join("+") + " (" + id + ") err=" + err);
      res.sendStatus(400);
    } else {
      console.log("GET /data?id=" + ids.join("+") + " (" + id + ") in " +
                  (new Date - t0) + "ms" + (refresh ? " [refresh]" : ""));
      res.json(obj);
    }
  });
};

app.get("/data", (req, res) => {
  sendData(authToken, req.query.id, req, res);
});

app.get("/d/:id", (req, res) => {
  sendData(authToken, req.params.id, req, res);
});

const sendCode = (id, req, res) => {
  // Send the source code for an item.
  var ids = decodeID(id);
  var langID = ids[0];
  var codeID = ids[1];
  getItem(codeID, (err, row) => {
    if (!row) {
      console.log("ERROR [1] GET /code");
      res.sendStatus(404);
    } else {
      // No data provided, so obj code won't change.
      res.json({
        id: codeID,
        src: row.src,
      });
    }
  });
};

app.get('/code', (req, res) => {
  sendCode(req.query.id, req, res);
});

app.get("/c/:id", (req, res) => {
  sendCode(req.params.id, req, res);
});

let pingCache = {};
function pingLang(lang, resume) {
  if (pingCache[lang]) {
    resume(true);
  } else {
    let options = {
      method: 'GET',
      host: getAPIHost(lang),
      port: getAPIPort(lang),
      path: '/lang?id=' + lang.slice(1),
    };
    let protocol = LOCAL_COMPILES && http || https;
    req = protocol.request(options, function(r) {
      let pong = r.statusCode === 200;
      pingCache[lang] = pong;
      resume(pong);
    }).on("error", (e) => {
      console.log("ERROR pingLang() e=" + JSON.stringify(e));
      resume(false);
    }).end();
  }
}

function get(language, path, resume) {
  var data = [];
  var options = {
    host: getAPIHost(language),
    port: getAPIPort(language),
    path: "/" + language + "/" + path,
  };
  let protocol = LOCAL_COMPILES && http || https;
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
function postItem(language, src, ast, obj, user, parent, img, label, forkID, resume) {
  parent = decodeID(parent)[1];
  // ast is a JSON object
  var forks = 0;
  var views = 0;
  obj = cleanAndTrimObj(obj);
  img = cleanAndTrimObj(img);
  src = cleanAndTrimSrc(src);
  ast = cleanAndTrimSrc(JSON.stringify(ast));
  var queryStr =
    "INSERT INTO pieces (address, fork_id, user_id, parent_id, views, forks, created, src, obj, language, label, img, ast)" +
    " VALUES ('" + clientAddress + "','" + forkID + "','" + user + "','" + parent + " ','" + views + " ','" + forks + "',now(),'" + src + "','" + obj + "','" + language + "','" +
    label + "','" + img + "','" + ast + "');"
  let t0 = new Date;
  dbQuery(queryStr, function(err, result) {
    let t1 = new Date;
    if (err) {
      console.log("ERROR postItem() " + queryStr);
      resume(err);
    } else {
      var queryStr = "SELECT * FROM pieces WHERE language='" + language + "' ORDER BY id DESC LIMIT 1";
      dbQuery(queryStr, function (err, result) {
        let t2 = new Date;
        let codeID = +result.rows[0].id;
        forkID = forkID || codeID;
        var query =
          "UPDATE pieces SET " +
          "fork_id=" + forkID + " " +
          "WHERE id=" + codeID;
        dbQuery(query, function (err) {
          dbQuery("UPDATE pieces SET forks=forks+1 WHERE id=" + parent, () => {});
          resume(err, result);
        });
      });
    }
  });
};

// Commit and return commit id
function updateItem(id, language, src, ast, obj, img, resume) {
  var views = 0;
  var forks = 0;
  obj = cleanAndTrimObj(obj);
  img = cleanAndTrimObj(img);
  src = cleanAndTrimSrc(src);
  ast = cleanAndTrimSrc(JSON.stringify(ast));
  var query =
    "UPDATE pieces SET " +
    "src='" + src + "'," +
    "ast='" + ast + "'," +
    "obj='" + obj + "'," +
    "img='" + img + "'" +
    "WHERE id='" + id + "'";
  dbQuery(query, function (err) {
    resume(err, []);
  });
};

function countView(id) {
  var query =
    "UPDATE pieces SET " +
    "views=views+1 " +
    "WHERE id='" + id + "'";
  dbQuery(query, function (err) {
    if (err && err.length) {
      console.log("ERROR updateViews() err=" + err);
    }
  });
}

function updateAST(id, ast, resume) {
  // Get codeID from table asts.
  // Set pieces.code_id to codeID.
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
function getData(auth, ids, refresh, resume) {
  if (encodeID(ids) === nilID || ids.length === 3 && +ids[2] === 0) {
    resume(null, {});
  } else {
    // Compile the tail.
    let id = encodeID(ids.slice(2));
    compileID(auth, id, {refresh: refresh}, resume);
  }
}

function getCode(ids, refresh, resume) {
  getItem(ids[1], (err, item) => {
    // if L113 there is no AST.
    if (!refresh && item && item.ast) {
      let ast = typeof item.ast === "string" && JSON.parse(item.ast) || item.ast;
      resume(err, ast);
    } else {
      if (ids[0] !== 113) {
        assert(item, "ERROR getCode() item not found: " + ids);
        let lang = item.language;
        let src = item.src.replace(/\\\\/g, "\\");
        console.log("Reparsing SRC: langID=" + ids[0] + " codeID=" + ids[1] + " src=" + src);
        parse(lang, src, (err, ast) => {
          updateAST(ids[1], ast, (err)=>{
            assert(!err);
          });
          // Don't wait for update.
          resume(err, ast);
        });
      } else {
        resume(err, {});
      }
    }
  });
}

function langName(id) {
  id = +id;
//  return "L" + (id < 10 ? "00" + id : id < 100 ? "0" + id : id);
  return "L" + id;
}

function getLang(ids, resume) {
  let langID = ids[0];
  if (langID !== 0) {
    resume(null, langName(langID));
  } else {
    // Get the language name from the item.
    getItem(ids[1], (err, item) => {
      resume(err, item.language);
    });
  }
}

function compileID(auth, id, options, resume) {
  let refresh = options.refresh;
  let dontSave = options.dontSave;
  if (id === nilID) {
    resume(null, {});
  } else {
    if (refresh) {
      delCache(id, "data");
    }
    getCache(id, "data", (err, val) => {
      if (val) {
        // Got cached value. We're done.
        resume(err, val);
      } else {
        let ids = decodeID(id);
        countView(ids[1]);  // Count every time code is used to compile a new item.
        getData(auth, ids, refresh, (err, data) => {
          getCode(ids, refresh, (err, code) => {
            if (err && err.length) {
              resume(err, null);
            } else {
              getLang(ids, (err, lang) => {
                if (err && err.length) {
                  resume(err, null);
                } else {
                  if (lang === "L113" && Object.keys(data).length === 0) {
                    // No need to recompile.
                    getItem(ids[1], (err, item) => {
                      if (err && err.length) {
                        resume(err, null);
                      } else {
                        try {
                          let obj = JSON.parse(item.obj);
                          setCache(lang, id, "data", obj);
                          resume(err, obj);
                        } catch (e) {
                          // Oops. Missing or invalid obj, so need to recompile after all.
                          // Let downstream compilers know they need to refresh
                          // any data used. Prefer true over false.
                          comp(auth, lang, code, data, options, (err, obj) => {
                            if (err) {
                              resume(err);
                            } else {
                              setCache(lang, id, "data", obj);
                              resume(null, obj);
                            }
                          });
                        }
                      }
                    });
                  } else {
                    if (lang && code) {
                      assert(code.root !== undefined, "Invalid code for item " + ids[1]);
                      // Let downstream compilers know they need to refresh
                      // any data used.
                      comp(auth, lang, code, data, options, (err, obj) => {
                        if (err) {
                          resume(err);
                        } else {
                          if (!dontSave) {
                            setCache(lang, id, "data", obj);
                            if (ids[2] === 0 && ids.length === 3) {
                              // If this is pure code, then update OBJ.
                              updateOBJ(ids[1], obj, (err)=>{ assert(!err) });
                            }
                          }
                          resume(null, obj);
                        }
                      });
                    } else {
                      // Error handling here.
                      console.log("ERROR compileID() ids=" + ids + " missing code");
                      resume(null, {});
                    }
                  }
                }
              });
            }
          });
        });
      }
    });
  }
}
function comp(auth, lang, code, data, options, resume) {
  pingLang(lang, pong => {
    if (pong) {
      const config = {};
      // Compile ast to obj.
      let langID = lang.indexOf("L") === 0 && lang.slice(1) || lang;
      var encodedData = JSON.stringify({
        "item": {
          lang: langID,
          code: code,
          data: data,
          options: options,
        },
        config: config,
        auth: auth,
      });
      var reqOptions = {
        host: getAPIHost(lang),
        port: getAPIPort(lang),
        path: "/compile",
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(encodedData),
        },
      };
      let protocol = LOCAL_COMPILES && http || https;
      var req = protocol.request(reqOptions, function(res) {
        var data = "";
        res.on('data', function (chunk) {
          data += chunk;
        });
        res.on('end', function () {
          resume(null, parseJSON(data));
        });
        res.on('error', function (err) {
          console.log("ERROR [1] comp() err=" + err);
          resume(404);
        });
      });
      req.write(encodedData);
      req.end();
      req.on('error', function(err) {
        console.log("ERROR [2] comp() err=" + err);
        resume(404);
      });
    } else {
      resume(404);
    }
  });
}

const parseID = (id, options, resume) => {
  let ids = decodeID(id);
  getItem(ids[1], (err, item) => {
    if (err && err.length) {
      resume(err, null);
    } else {
      // if L113 there is no AST.
      const lang = item.language;
      const src = item.src;
      if (src) {
        parse(lang, src, (err, ast) => {
          if (!ast || Object.keys(ast).length === 0) {
            console.log("NO AST for SRC " + src);
          }
          if (JSON.stringify(ast) !== JSON.stringify(item.ast)) {
            if (ids[1] && !options.dontSave) {
              console.log("Saving AST for id=" + id);
              updateAST(ids[1], ast, (err)=>{
                assert(!err);
                resume(err, ast);
              });
            } else {
              resume(err, ast);
            }
          } else {
            resume(err, ast);
          }
        });
      } else {
        resume(["ERROR no source. " + id]);
      }
    }
  });
};
const clearCache = (type, items) => {
  getKeys("*" + type, (err, keys) => {
    items = items || keys;
    let count = 0;
    items.forEach((item) => {
      item = item.indexOf(type) < 0 ? item + type : item; // Append type of not present.
      if (keys.indexOf(item) >= 0) {
        console.log("deleting " + (++count) + " of " + keys.length + ": " + item);
        delCache(item.slice(0, item.indexOf(type)), type);
      } else {
        console.log("unknown " + item);
      }
    });
  })
};
const recompileItems = (items) => {
  let id = items.shift();
  delCache(id, "data");
  parseID(id, {}, (err, ast) => {
    console.log(items.length + ": " + id + " parsed");
    if (err && err.length) {
      console.log("[5] ERROR " + err);
    }
    compileID(authToken, id, true, (err, obj) => {
      console.log(items.length + ": " + id + " compiled");
      recompileItems(items);
    });
  });
};
const recompileItem = (id, parseOnly) => {
  delCache(id, "data");
  parseID(id, {}, (err, ast) => {
    console.log(id + " parsed");
    if (err && err.length) {
      console.log("ERROR [6] err=" + err);
      return;
    }
    if (!parseOnly) {
      compileID(authToken, id, {refresh: true}, (err, obj) => {
        console.log(id + " compiled");
        let ids = decodeID(id);
        updateOBJ(ids[1], obj, (err)=>{ assert(!err) });
      });
    } else {
    }
  });
};
const getIDFromType = (type) => {
  // FIXME make this generic.
  switch (type) {
  default:
    return null;
  }
};
const batchCompile = (auth, items, index, res, resume) => {
  index = +index || 0;
  // For each item, get the dataID and concat with codeID of alias.
  if (index < items.length) {
    res && res.write(" ");
    let t0 = new Date;
    let item = items[index];
    let codeID = item.id || getIDFromType(item.type);
    let data = item.data;
    putData(auth, data, (err, dataID) => {
      let codeIDs = decodeID(codeID);
      let dataIDs = decodeID(dataID);
      let id = encodeID(codeIDs.slice(0,2).concat(dataIDs));
      item.id = id;
      item.image_url = "https://cdn.acx.ac/" + id + ".png";
      delete item.data;
      compileID(auth, id, {refresh: DEBUG}, (err, obj) => {
        item.data = obj;
        batchCompile(auth, items, index + 1, res, resume);
        console.log("COMPILE " + (index + 1) + "/" + items.length + ", " + id + " in " + (new Date - t0) + "ms");
      });
    });
  } else {
    resume(null, items);
  }
};
app.put('/comp', function (req, res) {
  let t0 = new Date;
  let body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  let data = body;
  let auth = req.headers.authorization;
  let date = new Date().toUTCString();
  postAuth("/validate", { jwt: auth }, (err, val) => {
    let t1 = new Date;
    console.log("postAuth() in " + (t1 - t0) + "ms");
    if (err) {
      res.sendStatus(err);
    } else {
      let address = val.address;
      let t2 = new Date;
      // console.log("putData() in " + (t2 - t1) + "ms");
      res.writeHead(202, {"Content-Type": "application/json"});
      batchCompile(auth, data, 0, res, (err, data) => {
        let t3 = new Date;
        console.log("batchCompile() in " + (t3 - t2) + "ms");
        res.end(JSON.stringify(data));
        let itemIDs = [];
        let doScrape;
        let str = "grid [\n";
        str += 'row twelve-columns [br, ';
        str += 'style { "fontSize": "14"} cspan "Client: ' + address + '", ';
        str += 'style { "fontSize": "14"} cspan "Posted: ' + date + '"';
        str += '],\n';
        data.forEach((val, i) => {
          itemIDs.push(val.id);
          let langID = decodeID(val.id)[0];
          if (langID === 104) {
            str +=
            'row twelve-columns [href "item?id=' + val.id +
              '" img "https://cdn.acx.ac/' + val.id + '.png", h4 "' + (i + 1) +
              ' of ' + data.length + ': ' + val.id + '"],\n';
            doScrape = true;
          } else {
            // str +=
            //   'row twelve-columns [href "item?id=' + val.id +
            //   '" form "' + val.id + '", h4 "' + (i + 1) +
            //   ' of ' + data.length + ': ' + val.id + '"],\n';
          }
        });
        str += "]..";
        if (doScrape) {
          putCode(auth, "L116", str, async (err, val) => {
            console.log("PUT /comp proofsheet: https://acx.ac/form?id=" + val.id);
            let browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
            batchScrape(browser, false, itemIDs, 0, () => {
              browser.close();
            });
          });
        }
        putData(auth, {
          address: address,
          type: "batchCompile",
          date: date,
          items: itemIDs,
        }, () => {}); // Record batch.
      });
    }
  });
});
function getTip(id, resume) {
  let t0 = new Date;
  let [langID, codeID, dataID] = decodeID(id);
  // -- If is 0 then return 0.
  // -- If is forkID the return last item in fork or the original codeID if none.
  // -- If is not a forkID then return original codeID.
  if (!id || codeID === 0) {
    resume(null, 0);
  } else if (langID === 0 && dataID === 0) {
    // A forkID is just 0+codeID+0 for the root item of the fork. So if there
    // is no items with that forkID just return the itemID.
    let query =
      "SELECT id FROM pieces WHERE fork_id=" + codeID +
      " ORDER BY id DESC LIMIT 1";
    dbQuery(query, function(err, result) {
      let t1 = new Date;
      resume(null, result.rows.length === 0 && codeID || result.rows[0].id || 0);
    });
  } else {
    // Not a forkID so just return the codeID.
    resume(null, codeID);
  }
}
app.put('/compile', function (req, res) {
  // This end point is hit when code is edited. If the code already exists for
  // the current user, then recompile it and update the OBJ. If it doesn't exist
  // for the current user, then create a new item.
  let lang = req.body.language;
  let t0 = new Date;
  validateUser(req.body.jwt, lang, (err, data) => {
    if (err) {
      res.sendStatus(err);
    } else {
      // let t1 = new Date;
      // TODO user is known but might not have access to this operation. Check
      // user id against registered user table for this host.
      // Map AST or SRC into OBJ. Store OBJ and return ID.
      // Compile AST or SRC to OBJ. Insert or add item.
      let id = req.body.id;
      let forkID = req.body.forkID || 0;
      let ids = decodeID(id);
      let rawSrc = req.body.src;
      let src = cleanAndTrimSrc(req.body.src);
      let ast = req.body.ast;
      let ip = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
      let user = +req.body.userID || dot2num(ip);  // Use IP address if userID not avaiable.
      let img = "";
      let obj = "";
      let label = "show";
      let parent = req.body.parent || 0;
      let query;
      let itemID = id && +ids[1] !== 0 ? +ids[1] : undefined;
      if (!ast) {
        console.log("No AST, parsing: " + rawSrc);
        // No AST, try creating from source.
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
          updateItem(itemID, lang, rawSrc, ast, obj, img, (err) => {
            // let t2 = new Date;
            // Update the src and ast because they are used by compileID().
            if (err) {
              console.log("ERROR [1] PUT /compile err=" + err);
              res.sendStatus(400);
            } else {
              compileID(authToken, id, {refresh: true}, (err, obj) => {
                // let t3 = new Date;
                // console.log("t1=" + (t1 - t0) + " t2=" + (t2 - t1) + " t3=" + (t3 - t2));
                console.log("PUT /compile?id=" + ids.join("+") + " (" + id + ") in " +
                            (new Date - t0) + "ms");
                res.json({
                  id: id,
                  obj: obj,
                });
              });
            }
          });
        } else {
          let ids = decodeID(parent);
          // TODO need to get tip of fork in a efficient way.
          // getTip(forkID, (err, tip) => {
          //   if (+tip === 0 || +tip !== +ids[1]) {
          //     // Implicit fork. If parentID is zero, then forkID will be zero.
          //     forkID = 0;
          //   }
          // });
          postItem(lang, rawSrc, ast, obj, user, parent, img, label, forkID, (err, result) => {
            // let t2 = new Date;
            if (err) {
              console.log("ERROR [2] PUT /compile err=" + err);
              response.sendStatus(400);
            } else {
              let langID = lang.charAt(0) === "L" ? +lang.substring(1) : +lang;
              let codeID = result.rows[0].id;
              let dataID = 0;
              if (forkID === 0) {
                forkID = codeID;
              }
              let ids = [langID, codeID, dataID];
              let id = encodeID(ids);
              compileID(authToken, id, {refresh: false}, (err, obj) => {
                // let t3 = new Date;
                // console.log("t1=" + (t1 - t0) + " t2=" + (t2 - t1) + " t3=" + (t3 - t2));
                console.log("PUT /compile?id=" + ids.join("+") + " (" + id + ")* in " +
                            (new Date - t0) + "ms");
                res.json({
                  forkID: forkID,
                  id: id,
                  obj: obj,
                });
              });
            }
          });
        }
      }
    }
  })
});
const putData = (auth, data, resume) => {
  if (!data || !Object.keys(data).length) {
    resume(null, undefined);
    return;
  }
  let t0 = new Date;
  let rawSrc = JSON.stringify(data) + "..";
  let src = cleanAndTrimSrc(rawSrc);
  let obj = cleanAndTrimObj(JSON.stringify(data));
  let lang = "L113";
  let user = 0;
  var ast = null;
  var label = "data";
  var parent = 0;
  var img = "";
  let forkID = 0;
  postItem(lang, rawSrc, ast, obj, user, parent, img, label, forkID, (err, result) => {
    let langID = lang.charAt(0) === "L" ? +lang.substring(1) : +lang;
    let codeID = result.rows[0].id;
    let dataID = 0;
    let ids = [langID, codeID, dataID];
    let id = encodeID(ids);
    if (err) {
      console.log("ERROR putData() err=" + err);
      resume(err);
    } else {
      resume(null, id);
    }
  });
};
function putCode(auth, lang, rawSrc, resume) {
  let t0 = new Date;
  // Compile AST or SRC to OBJ. Insert or add item.
  let src = cleanAndTrimSrc(rawSrc);
  let user = 0;
  let img = "";
  let obj = "";
  let label = "show";
  let parent = 0;
  let query = "SELECT * FROM pieces WHERE language='" + lang + "' AND user_id='" + user + "' AND src = '" + src + "' ORDER BY pieces.id";
  dbQuery(query, function(err, result) {
    var row = result.rows[0];
    itemID = row && row.id || undefined;
    ast = row && row.ast || null;
    if (!ast) {
      // No AST, try creating from source.
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
        updateItem(itemID, lang, rawSrc, ast, obj, img, (err) => {
          // Update the src and ast because they are used by compileID().
          if (err) {
            console.log("ERROR [1] PUT /compile err=" + err);
            resume(400, null);
          } else {
            compileID(auth, id, {}, (err, obj) => {
              // console.log("putCode() id=" + ids.join("+") + " (" + id + ") in " +
              //             (new Date - t0) + "ms");
              resume(null, {
                id: id,
                obj: obj,
              });
            });
          }
        });
      } else {
        let forkID = 0;
        postItem(lang, rawSrc, ast, obj, user, parent, img, label, forkID, (err, result) => {
          if (err) {
            console.log("ERROR [2] PUT /compile err=" + err);
            resume(400);
          } else {
            let langID = lang.charAt(0) === "L" ? +lang.substring(1) : +lang;
            let codeID = result.rows[0].id;
            let dataID = 0;
            let ids = [langID, codeID, dataID];
            let id = encodeID(ids);
            compileID(auth, id, {}, (err, obj) => {
              console.log("putCode() id=" + ids.join("+") + " (" + id + ")* in " +
                          (new Date - t0) + "ms");
              resume(null, {
                id: id,
                obj: obj,
              });
            });
          }
        });
      }
    }
  });
}
app.put('/code', (req, response) => {
  // Insert or update code without recompiling.
  let t0 = new Date;
  let body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  let id = body.id;
  let ids = id !== undefined ? decodeID(id) : [0, 0, 0];
  let rawSrc = body.src
  let src = cleanAndTrimSrc(rawSrc);
  let lang = body.language;
  let ip = req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
  let user = req.body.userID || dot2num(ip);
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
      var parent = body.parent ? body.parent : row.parent_id;
      var img = body.img ? body.img : row.img;
      var label = body.label ? body.label : row.label;
      updateItem(itemID, lang, rawSrc, ast, obj, img, function (err, data) {
        if (err) {
          console.log("[9] ERROR " + err);
        }
      });
      // Don't wait for update. We have what we need to respond.
      let langID = lang.charAt(0) === "L" ? +lang.substring(1) : +lang;
      let codeID = result.rows[0].id;
      let dataID = 0;
      let ids = [langID, codeID, dataID];
      let id = encodeID(ids);
      console.log("PUT /code?id=" + ids.join("+") + " (" + id + ") in " +
                  (new Date - t0) + "ms");
      response.json({
        id: id,
      });
    } else {
      var src = body.src;
      var lang = body.language;
      var ast = body.ast ? JSON.parse(body.ast) : null;  // Possibly undefined.
      var obj = body.obj;
      var label = body.label;
      var parent = body.parent ? body.parent : 0;
      var img = "";
      let forkID = 0;
      postItem(lang, rawSrc, ast, obj, user, parent, img, label, forkID, (err, result) => {
        let langID = lang.charAt(0) === "L" ? +lang.substring(1) : +lang;
        let codeID = result.rows[0].id;
        let dataID = 0;
        let ids = [langID, codeID, dataID];
        let id = encodeID(ids);
        if (err) {
          console.log("ERROR PUT /code err=" + err);
          response.sendStatus(400);
        } else {
          console.log("PUT /code?id=" + ids.join("+") + " (" + id + ")* in " +
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
  let userID = req.query.userID;
  let queryStr = "";
  let table = req.query.table || "pieces";
  if (req.query.list) {
    let list = req.query.list;
    queryStr =
      "SELECT * FROM " + table + " WHERE pieces.id" +
      " IN ("+list+") ORDER BY id DESC";
  } else if (req.query.where) {
    let fields = req.query.fields ? req.query.fields : "id";
    let limit = req.query.limit;
    let where = req.query.where;
    queryStr =
      "SELECT " + fields +
      " FROM " + table + " WHERE " + where +
      " ORDER BY id DESC" +
      (limit ? " LIMIT " + limit : "");
  } else {
    console.log("ERROR [1] GET /items");
    res.sendStatus(400);
  }
  dbQuery(queryStr, function (err, result) {
    var rows;
    if (!result || result.rows.length === 0) {
      rows = [];
    } else {
      rows = result.rows;
    }
    let mark = req.query.stat && req.query.stat.mark;
    if (mark !== undefined) {
      dbQuery("SELECT codeid FROM items WHERE " +
              "userid='" + userID +
              "' AND mark='" + mark + "'",
              (err, result) => {
                let list = [];
                result.rows.forEach(row => {
                  list.push(row.codeid);
                });
                let selection = [];
                rows.forEach(row => {
                  if (list.includes(row.id)) {
                    selection.push(row);
                  }
                });
                console.log("GET /items selection=" + JSON.stringify(selection));
                res.send(selection)
              });
    } else {
      res.send(rows);
    }
  });
  req.on('error', function(e) {
    console.log("[10] ERROR " + e);
    console.log("ERROR [2] GET /items err=" + err);
    res.sendStatus(400);
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
          res.sendStatus(400);
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

const assetCache = {};
app.get("/:lang/*", function (req, response) {
  // /L106/lexicon.js
  let lang = req.params.lang;
  let path = req.url;
  let data;
  if ((data = assetCache[path])) {
    response.send(data);
  } else {
    pingLang(lang, pong => {
      if (pong) {
        let data = [];
        let options = {
          host: getAPIHost(lang),
          port: getAPIPort(lang),
          path: path,
        };
        let protocol = LOCAL_COMPILES && http || https;
        req = protocol.get(options, function(res) {
          res.on("data", function (chunk) {
            data.push(chunk);
          }).on("end", function () {
            data = assetCache[path] = data.join("");
            response.send(data);
          });
        });
      } else {
        response.sendStatus(404);
      }
    });
  }
});

function getCompilerHost(lang, options) {
  if (LOCAL_COMPILES) {
    return "localhost";
  } else {
    return lang + ".artcompiler.com";
  }
}

function getCompilerPort(lang) {
  if (LOCAL_COMPILES) {
    return "5" + lang.substring(1);  // e.g. L103 -> 5103
  } else {
    return "80";
  }
}

function getAPIHost(lang, options) {
  if (LOCAL_COMPILES) {
    return "localhost";
  } else {
    return "api.artcompiler.com";
  }
}

function getAPIPort(lang) {
  if (LOCAL_COMPILES) {
    return "3100";
  } else {
    return "443";
  }
}

dbQuery("SELECT NOW() as when", (err, result) => {
  if (err) {
    console.error(err.stack);
    process.exit(1);
  }
  if (result.rows.length > 0) {
    console.log(`Database Time: ${result.rows[0].when}`);
  }
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
      if (res.statusCode === 401) {
        resume(res.statusCode, data);
      } else {
        try {
          data = JSON.parse(data);
          resume(data.error, data);
        } catch (e) {
          console.log("[11] ERROR " + data + " statusCode=" + res.statusCode);
          console.log(e.stack);
        }
      }
    }).on("error", function () {
      console.log("error() status=" + res.statusCode + " data=" + data);
    });
  });
  req.end(encodedData);
  req.on('error', function(err) {
    console.log("[12] ERROR " + err);
    resume(err);
  });
}

// User sign-in

app.post('/signIn', (req, res) => {
  if (!req.body.name || !req.body.number) {
    res.sendStatus(400);
    return;
  }
  postAuth("/signIn", req.body, (err, data) => {
    res.send({
      err: err,
      jwt: data.jwt,
    });
  });
});

app.post('/finishSignIn', (req, res) => {
  if (!req.body.jwt && !req.body.passcode) {
    res.sendStatus(400);
    return;
  }
  postAuth("/finishSignIn", req.body, (err, data) => {
    res.send({
      err: err,
      userID: data.id,
      jwt: data.jwt,
    });
  });
});

const validatedUsers = {};
const authorizedUsers = [
];
function validateUser(token, lang, resume) {
  if (token === undefined) {
    // User has not signed in.
    resume(401);
  } else if (DEBUG || validatedUsers[token]) {
    let data = validatedUsers[token];
    // NOTE here is an example of how to restrict access to some user.
    // if (authorizedUsers.includes(data.id)) {
    //   resume(null, data);
    // } else {
    //   // Got a valid user, but they don't have access to this resource.
    //   resume(403);
    // }
    resume(null, data);
  } else {
    postAuth("/validateSignIn", {
      jwt: token,
    }, (err, data) => {
      if (err) {
        // There is an issue with sign in.
        resume(err);
      } else {
        // if (authorizedUsers.includes(data.id)) {
        //   validatedUsers[token] = data;
        //   resume(err, data);
        // } else {
        //   // Got a valid user, but they don't have access to this resource.
        //   resume(403);
        // }
        validatedUsers[token] = data;
        resume(err, data);
      }
    });
  }
}


// Client login

const clientAddress = process.env.ARTCOMPILER_CLIENT_ADDRESS
  ? process.env.ARTCOMPILER_CLIENT_ADDRESS
  : "0x0123456789abcdef0123456789abcdef01234567";
let authToken = process.env.ARTCOMPILER_CLIENT_SECRET;
if (!module.parent) {
  var port = process.env.PORT || 3000;
  app.listen(port, async function() {
    console.log("Listening on " + port);
    console.log("Using address " + clientAddress);
    if (!authToken) {
      // Secret not stored in env so get one.
      console.log("ARTCOMPILER_CLIENT_SECRET not set. Generating a temporary secret.");
      postAuth("/login", {
        "address": clientAddress,
      }, (err, data) => {
        postAuth("/finishLogin", {
          "jwt": data.jwt,
        }, (err, data) => {
          // Default auth token.
          authToken = data.jwt;
        });
      });
    }
    // recompileItems([
    // ], [], {});
    // let browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
    // batchScrape(browser, true, [
    // ], 0, () => {
    //   browser.close();
    // });
    // batchCompile(authToken, [{
    //   id: "2MgH5praFL",
    //   data: [
    //     "a=-3",
    //   ]}], 0, null, (err, val)=>{
    //     console.log("batchCompile() val=" + JSON.stringify(val, null, 2));
    //   });
    // putComp([], clientSecret);
  });
}

// Client URLs

function putComp(data, secret, resume) {
  let encodedData = JSON.stringify(data);
  var options = {
    host: "acx.ac",
    port: "443",
    path: "/comp",
    method: "PUT",
    headers: {
      "Content-Type": "text/plain",
      "Content-Length": Buffer.byteLength(encodedData),
      "Authorization": secret,
    },
  };
  var req = https.request(options);
  req.on("response", (res) => {
    var data = "";
    res.on('data', function (chunk) {
      data += chunk;
    }).on('end', function () {
      if (resume) {
        resume(null, JSON.parse(data));
      }
    }).on("error", function (err) {
      console.log("[13] ERROR " + err);
    });
  });
  req.end(encodedData);
  req.on('error', function(err) {
    console.log("[14] ERROR " + err);
    resume(err);
  });
}
