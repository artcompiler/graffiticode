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
var cache; // = redis.createClient(process.env.REDIS_URL);
var main = require('./main.js');
var Hashids = require("hashids");
const atob = require("atob");
const puppeteer = require("puppeteer");
const AWS = require('aws-sdk');

// Configuration

const DEBUG = false;
const LOCAL_COMPILES = false;
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
    // if (req.headers.host.match(/^www/) === null) {
    //   console.log("app.all redirecting headers=" + JSON.stringify(req.headers, null, 2) + " url=" + req.url);
    //   res.redirect('https://www.'+ req.headers.host + req.url);
    // } else
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
app.set('public', __dirname + '/public');
app.use(morgan('combined', {
  skip: function (req, res) { return res.statusCode < 400 }
}));

app.use(bodyParser.urlencoded({ extended: false, limit: 100000000 }));
app.use(bodyParser.text({limit: '50mb'}));
app.use(bodyParser.raw({limit: '50mb'}));
app.use(bodyParser.json({ type: 'application/vnd.api+json', limit: '50mb' }));
app.use(methodOverride());
app.use(express.static(__dirname + '/public'));
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
  // else gets erased. This is to enable updating the dataID.
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
  if (ids.length === 0) {
    ids = [0, 0, 0]; // Invalid id
  } else if (ids.length === 1) {
    ids = [0, ids[0], 0];
  } else if (ids.length === 2) {
    // Legacy code+data
    ids = [0, ids[0], 113, ids[1], 0];
  } else if (ids.length === 3 && ids[2] !== 0) {
    // Legacy lang+code+data
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

// http://stackoverflow.com/questions/10435407/proxy-with-express-js
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

// Get ping
const sendPing = (id, req, res) => {
  let useShort = req.path.indexOf("/p/") === 0;
  let ids = decodeID(id);
  console.log("GET /ping?id=" + ids.join("+") + " (" + id + ")");
  let t0 = new Date;
  let urls = {};
  getCache(id, "data", (err, val) => {
    if (val) {
      urls["data"] = (useShort ? "/d/" : "/data?id=") + id;
    }
    getCache(id, "snap", (err, val) => {
      if (val) {
        urls["snap"] = (useShort ? "/s/" : "/snap?id=") + id;
      }
      getCache(id, "snap-base64-png", (err, val) => {
        if (val) {
          if (val.indexOf("https://cdn.acx.ac") === 0) {
            urls["snap/png"] = val;
          } else {
            urls["snap/png"] = (useShort ? "/s/" : "/snap?id=") + id + (useShort ? "?fmt=png" : "&fmt=png");
          }
        }
        res.json(urls);
      });
    });
  });
};
app.get("/ping", (req, res) => {
  sendPing(req.query.id, req, res);
});
app.get("/p/:id", (req, res) => {
  sendPing(req.params.id, req, res);
});

// Update a label
app.put('/label', function (req, res) {
  let ids = decodeID(req.body.id);
  let itemID = ids[1];
  var label = req.body.label;
  dbQuery("UPDATE pieces SET label = '" + label + "' WHERE id = '" + itemID + "'", (err, val) => {
  });
  res.sendStatus(200)
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
            getCompilerVersion(lang, (version) => {
              console.log("GET /lang version=" + version);
              if (version !== undefined) {
                var insertStr =
                  "INSERT INTO pieces (user_id, parent_id, views, forks, created, src, obj, language, label, img)" +
                  " VALUES ('" + 0 + "', '" + 0 + "', '" + 0 +
                  " ', '" + 0 + "', now(), '" + "| " + lang + "', '" + "" +
                  " ', '" + lang + "', '" + "show" + "', '" + "" + "');"
                console.log("GET /lang insertStr=" + insertStr);
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
                res.sendStatus(404);
              }
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
  const hasEditingRights = true;   // Compute based on authorization.
  if (req.query.alias) {
    aliases[req.query.alias] = id;
  }
  if (hasEditingRights) {
    let ids = decodeID(id);
    if (ids[1] === 0 && aliases[id]) {
      // ID is an invalid ID but a valid alias, so get aliased ID.
      ids = decodeID(aliases[id]);
    }
    let langID = ids[0];
    let codeID = ids[1];
    if (+langID !== 0) {
      let lang = langName(langID);
      getCompilerVersion(lang, (version) => {
        res.render('views.html', {
          title: 'Graffiti Code',
          language: lang,
          item: encodeID(ids),
          view: "item",
          version: version,
          refresh: req.query.refresh,
          archive: req.query.archive,
          showdata: req.query.data,
        }, function (error, html) {
          if (error) {
            console.log("ERROR [1] GET /item err=" + error);
            res.sendStatus(400);
          } else {
            res.send(html);
          }
        });
      });
    } else {
      getItem(codeID, (err, row) => {
        if (err && err.length) {
          console.log("[1] GET /item ERROR 404 ");
          res.sendStatus(404);
        } else {
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
              archive: req.query.archive,
              showdata: req.query.data,
            }, function (error, html) {
              if (error) {
                console.log("ERROR [2] GET /item err=" + error);
                res.sendStatus(400);
              } else {
                res.send(html);
              }
            });
          });
        }
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
    console.log("[1] GET /form ERROR 404 id=" + id + " ids=" + ids.join("+"));
    res.sendStatus(404);
    return;
  }
  if (!/[a-zA-Z]/.test(id)) {
    res.redirect("/form?id=" + encodeID(ids));
    return;
  }
  if (langID !== 0) {
    let lang = langName(langID);
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
          res.sendStatus(400);
        } else {
          res.send(html);
        }
      });
    });
  } else {
    // Don't have a langID, so get it from the database item.
    getItem(codeID, function(err, row) {
      if (!row) {
        console.log("[2] GET /form ERROR 404 ");
        res.sendStatus(404);
      } else {
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
              res.sendStatus(400);
            } else {
              res.send(html);
            }
          });
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

// Update a snap image.
app.put('/snap', function (req, res) {
  let id = req.body.id;
  let ids = decodeID(id);
  let lang = "L" + langName(ids[0]);
  let img = req.body.img;
  getCache(id, "snap", async (err, val) => {
    setCache(lang, id, "snap", img);
    // delCache(id, "snap-base64-png"); // Clear cached PNG.
    // let browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
    // makeSnap(browser, id, (err, val) => {
    //   browser.close();
    // });
    res.sendStatus(200);
  });
});

const uploadFileToS3 = (name, base64data) => {
  var s3 = new AWS.S3();
  let buffer = new Buffer(base64data, "base64");
  s3.putObject({
    Bucket: 'acx.ac',
    Key: name,
    Body: buffer,
    ContentEncoding: 'base64',
  }, (err, data) => {
    console.log("UPLOAD " + name);
  });
};

const makeSnap = (browser, id, resume) => {
  getCache(id, "snap-base64-png", (err, val) => {
    if (val) {
      if (val.indexOf("https://cdn.acx.ac") === 0) {
        // Already uploaded.
      } else {
        let name = id + ".png";
        setCache(null, id, "snap-base64-png", "https://cdn.acx.ac/" + name);
        uploadFileToS3(name, val, () => {});
      }
      resume();
    } else {
      (async() => {
        try {
          let t0 = new Date;
          let page = await browser.newPage();
          //await page.goto("http://localhost:3000/form?id=" + id);
          //await page.goto("https://www.graffiticode.com/form?id=" + id);
          await page.goto("https://acx.ac/form?id=" + id);
          const checkLoaded = async (t0) => {
            try {
              let td = new Date - t0;
              if (td > 10000) {
                resume("Aborting. Page taking too long to load.");
                return;
              }
              let isLoaded = !!(await page.$(".c3-legend-item-tile") ||
                                await page.$("circle.c3-shape") ||  // area chart
                                await page.$(".y-values"));  // table and horizontal ar chart
                if (isLoaded) {
                  // Viewer save snap, so our job is done here.
                  setTimeout(async () => {
                    try {
                      const svg = await page.$("svg");
                      const boxModel = await svg.boxModel();
                      const box = boxModel.content[2];
                      const x = 0;
                      const y = 0;
                      const width = box.x;
                      const height = box.y;
                      await page.setViewport({
                        width: width,
                        height: height,
                        deviceScaleFactor: 2,
                      });
                      const base64 = await page.screenshot({
                        encoding: "base64",
                        clip: {
                          x: x,
                          y: y,
                          width: width,
                          height: height,
                        },
                        omitBackground: true,
                      });
                      let name = id + ".png";
                      setCache(null, id, "snap-base64-png", "https://cdn.acx.ac/" + name);
                      uploadFileToS3(name, base64, () => {});
                      await page.close();
                      resume(null, base64);
                    } catch (x) {
                      console.log("ERROR loading " + id);
                      resume("ERROR loading " + id, null);
                    }
                  }, 500);  // Wait a second to let viewer do its thing before exiting.
                } else {
                  setTimeout(() => {
                    checkLoaded(t0);
                  }, 100);
                }
            } catch (x) {
              console.log("[1] ERROR " + x.stack);
              resume("ERROR id=" + id);
            }
          };
          checkLoaded(new Date);
        } catch (x) {
          console.log("[2] ERROR loading id=" + id);
          resume("ERROR id=" + id);
        }
      })();
    }
  });
};

const sendSnap = (id, fmt, req, res) => {
  let t0 = new Date;
  fmt = fmt && fmt.toLowerCase();
  let type = fmt === "png" ? "snap-base64-png" : "snap";
  getCache(id, type, (err, val) => {
    let refresh = !!req.query.refresh;
    let ids = decodeID(id);
    if (val) {
      if (fmt === "png") {
        if (val.indexOf("https://cdn.acx.ac") === 0) {
          // Redirect response to CDN cache.
          res.redirect(val);
        } else {
          let img = atob(val);
          res.writeHead(200, {'Content-Type': 'image/png' });
          res.end(img, 'binary');
        }
      } else {
        res.send(val);
      }
      console.log("GET /snap?id=" + ids.join("+") + " (" + id + ") in " +
                  (new Date - t0) + "ms" + (refresh ? " [refresh]" : ""));
    } else {
      (async () => {
        let browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
        makeSnap(browser, id, (err, val) => {
          browser.close();
          getCache(id, type, (err, val) => {
            if (val) {
              if (fmt === "png") {
                if (val.indexOf("https://cdn.acx.ac") === 0) {
                  // Redirect response to CDN cache.
                  res.redirect(val);
                } else {
                  let img = atob(val);
                  res.writeHead(200, {'Content-Type': 'image/png' });
                  res.end(img, 'binary');
                }
              } else {
                res.send(val);
              }
              console.log("GET /snap?id=" + ids.join("+") + " (" + id + ") in " +
                          (new Date - t0) + "ms" + (refresh ? " [refresh]" : ""));
            } else {
              // For some reason, the image can't be made.
              res.sendStatus(404);
            }
          });
        });
      })();
    }
  });
};

app.get("/snap", function (req, res) {
  let id = req.query.id;
  let fmt = req.query.fmt;
  sendSnap(id, fmt, req, res);
});

app.get("/s/:id", function (req, res) {
  let id = req.params.id;
  let fmt = req.query.fmt;
  sendSnap(id, fmt, req, res);
});

const sendData = (auth, id, req, res) => {
  let ids = decodeID(id);
  let refresh = !!req.query.refresh;
  let t0 = new Date;
  compileID(auth, id, refresh, (err, obj) => {
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
      console.log("[1] GET /code ERROR 404 ");
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

let compilerVersions = {};
function getCompilerVersion(lang, resume) {
  // Compiler version tells which parser to use.
  if (compilerVersions[lang]) {
    resume(compilerVersions[lang]);
  } else {
    pingLang(lang, (pong) => {
      if (pong) {
        var data = [];
        var options = {
          host: getCompilerHost(lang),
          port: getCompilerPort(lang),
          path: "/version",
        };
        try {
          var req = protocol.get(options, function(res) {
            res.on("data", function (chunk) {
              data.push(chunk);
            }).on("end", function () {
              let str = data.join("");
              let version = parseInt(str.substring(1));
              version = compilerVersions[lang] = isNaN(version) ? 0 : version;
              resume(version);
            }).on("error", () => {
              resume(null);
            });
          });
        } catch (e) {
          console.log("[3] ERROR " + e.stack);
          resume(null);
        }
      } else {
        resume(null);
      }
    });
  }
}
function pingLang(lang, resume) {
  let options = {
    method: 'HEAD',
    host: getCompilerHost(lang),
    port: getCompilerPort(lang),
    path: '/'
  };
  req = protocol.request(options, function(r) {
    resume(true);
  }).on("error", (e) => {
    console.log("ERROR language unavailable: " + lang);
    resume(false);
  }).end();
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
  parent = decodeID(parent)[1];
  // ast is a JSON object
  var forks = 0;
  var views = 0;
  obj = cleanAndTrimObj(obj);
  img = cleanAndTrimObj(img);
  src = cleanAndTrimSrc(src);
  ast = cleanAndTrimSrc(JSON.stringify(ast));

  var queryStr =
    "INSERT INTO pieces (address, user_id, parent_id, views, forks, created, src, obj, language, label, img, ast)" +
    " VALUES ('" + clientAddress + "','" + user + "','" + parent + " ','" + views + " ','" + forks + "',now(),'" + src + "','" + obj + "','" + language + "','" +
    label + "','" + img + "','" + ast + "');"
  dbQuery(queryStr, function(err, result) {
    if (err) {
      console.log("ERROR postItem() " + queryStr);
      resume(err);
    } else {
      var queryStr = "SELECT pieces.* FROM pieces ORDER BY pieces.id DESC LIMIT 1";
      dbQuery(queryStr, function (err, result) {
        resume(err, result);
        dbQuery("UPDATE pieces SET forks=forks+1 WHERE id=" + parent + ";", () => {});
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
    compileID(auth, id, refresh, resume);
  }
}

function getCode(ids, resume) {
  getItem(ids[1], (err, item) => {
    // if L113 there is no AST.
    if (item && item.ast) {
      let code = typeof item.ast === "string" && JSON.parse(item.ast) || item.ast;
      resume(err, code);
    } else {
      // console.log("No AST found for id=" + ids.join("+"));
      resume(err, {});
    }
  });
}

function langName(id) {
  id = +id;
  return "L" + (id < 10 ? "00" + id : id < 100 ? "0" + id : id);
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

function compileID(auth, id, refresh, resume) {
  if (id === nilID) {
    resume(null, {});
  } else {
    let ids = decodeID(id);
    if (refresh) {
      delCache(id, "data");
    }
    getCache(id, "data", (err, val) => {
      if (val) {
        // Got cached value. We're done.
        resume(err, val);
      } else {
        countView(ids[1]);  // Count every time code is used to compile a new item.
        getData(auth, ids, refresh, (err, data) => {
          getCode(ids, (err, code) => {
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
                          comp(auth, lang, code, data, refresh, (err, obj) => {
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
                      comp(auth, lang, code, data, refresh, (err, obj) => {
                        if (err) {
                          resume(err);
                        } else {
                          setCache(lang, id, "data", obj);
                          if (ids[2] === 0 && ids.length === 3) {
                            // If this is pure code, then update OBJ.
                            updateOBJ(ids[1], obj, (err)=>{ assert(!err) });
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
function comp(auth, lang, code, data, refresh, resume) {
  pingLang(lang, pong => {
    if (pong) {
      // Compile ast to obj.
      var path = "/compile";
      var encodedData = JSON.stringify({
        "description": "graffiticode",
        "language": lang,
        "src": code,
        "data": data,
        "refresh": refresh,
        "auth": auth,
      });
      var options = {
        host: getCompilerHost(lang),
        port: getCompilerPort(lang),
        path: path,
        method: 'GET',
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': Buffer.byteLength(encodedData),
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
        console.log("[4] ERROR " + err);
        resume(err);
      });
    } else {
      resume(404);
    }
  });
}

const parseID = (id, resume) => {
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
            if (+id) {
              updateAST(id, ast, (err)=>{
                assert(!err);
                resume(err, ast);
              });
            } else {
              resume(err, ast);
            }
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
const recompileItems = (items, parseOnly) => {
  items.forEach(id => {
    delCache(id, "data");
    parseID(id, (err, ast) => {
      console.log(id + " parsed");
      if (err.length) {
        console.log("[5] ERROR " + err);
        return;
      }
      compileID(authToken, id, true, (err, obj) => {
        print(id + " compiled\n");
      });
    });
  });
};
const recompileItem = (id, parseOnly) => {
  delCache(id, "data");
  parseID(id, (err, ast) => {
    print(id + " parsed");
    if (err.length) {
      console.log("[6] ERROR " + err);
      return;
    }
    if (!parseOnly) {
      compileID(authToken, id, true, (err, obj) => {
        print(" compiled\n");
        updateOBJ(id, obj, (err)=>{ assert(!err) });
      });
    } else {
      print("\n");
    }
  });
};
const batchScrape = async (browser, ids, index, resume) => {
  try {
    index = index || 0;
    if (index < ids.length) {
      let id = ids[index];
      let t0 = new Date;
      makeSnap(browser, id, (err, data) => {
        if (err) {
          batchScrape(browser, ids, index, resume); // Try again.
        } else {
          console.log("SNAP " + (index + 1) + "/" + ids.length + ", " + id + " in " + (new Date() - t0) + "ms");
          batchScrape(browser, ids, index + 1, resume);
        }
      });
    } else {
      resume && resume();
    }
  } catch (x) {
    console.log("[7] ERROR " + x.stack);
    resume && resume("ERROR batchScrape");
  }
};
const getIDFromType = (type) => {
  // FIXME make this generic.
  switch (type) {
  case "bar_2":
    return "o5dSOpgVcj";
  case "bar":
    return "RQRSmd3nHr";
  case "bar_stacked":
    return "zVQUWzbLuO";
  case "area":
    return "YnRFdBaBce";
  case "horizontal_bar":
    return "aL6i8JogHJ";
  case "table_2":
    return "dOWTnyAaca";
  default:
    console.log("ERROR unknown type " + type);
    return "";
  }
};
const batchCompile = (auth, items, index, res, resume) => {
  index = +index || 0;
  // For each item, get the dataID and concat with codeID of alias.
  if (index < items.length) {
    res.write(" ");
    let t0 = new Date;
    let item = items[index];
    let codeID = getIDFromType(item.type);
    let data = item.data;
    putData(auth, data, (err, dataID) => {
      let codeIDs = decodeID(codeID);
      let dataIDs = decodeID(dataID);
      let id = encodeID(codeIDs.slice(0,2).concat(dataIDs));
      item.id = id;
      item.image_url = "https://cdn.acx.ac/" + id + ".png";
      delete item.data;
      batchCompile(auth, items, index + 1, res, resume);
      compileID(auth, id, false, (err, val) => { /* nothing to do here */ });
      console.log("COMPILE " + (index + 1) + "/" + items.length + ", " + id + " in " + (new Date - t0) + "ms");
    });
  } else {
    resume(null, items);
  }
};
app.put('/comp', function (req, res) {
  // body={data, 
  let t0 = new Date;
  let body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  let data = body;
  let auth = req.headers.authorization;
  let date = new Date().toUTCString();
  postAuth("/validate", { jwt: auth }, (err, val) => {
    if (err) {
      res.sendStatus(err);
    } else {
      let address = val.address;
      putData(auth, {
        address: address,
        type: "batchCompile",
        date: date,
        data: data,
      }, () => {
        res.writeHead(202, {"Content-Type": "application/json"});
        batchCompile(auth, data, 0, res, (err, data) => {
          res.end(JSON.stringify(data));
          console.log("PUT /comp " + address + " (" + data.length + " items) in " + (new Date - t0) + "ms");
          let itemIDs = [];
          let str = "grid [\n";
          str += 'row twelve-columns [br, ';
          str += 'style { "fontSize": "14"} cspan "Client: ' + address + '", ';
          str += 'style { "fontSize": "14"} cspan "Posted: ' + date + '"';
          str += '],\n';
          data.forEach((val, i) => {
            itemIDs.push(val.id);
            str += 'row twelve-columns [href "item?id=' + val.id + '" img "https://cdn.acx.ac/' + val.id + '.png", h4 "' + (i + 1) + ' of ' + data.length + ': ' + val.id + '"],\n'
          });
          str += "]..";
          putCode(auth, "L116", str, async (err, val) => {
            console.log("PUT /comp proofsheet: https://acx.ac/form?id=" + val.id);
            let browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
            batchScrape(browser, itemIDs, 0, () => {
              browser.close();
            });
          });
          putData(auth, {
            address: address,
            type: "batchCompile",
            date: date,
            items: itemIDs,
          }, () => {}); // Record batch.
        });
      });
    }
  });
});
app.put('/compile', function (req, res) {
  // This end point is hit when code is edited. If the code already exists for
  // the current user, then recompile it and update the OBJ. If it doesn't exist
  // for the current user, then create a new item.
  let lang = req.body.language;
  validateUser(req.body.jwt, lang, (err, data) => {
    if (err) {
      res.sendStatus(err);
    } else {
      // TODO user is known but might not have access to this operation. Check
      // user id against registered user table for this host.
      // Map AST or SRC into OBJ. Store OBJ and return ID.
      let t0 = new Date;
      // Compile AST or SRC to OBJ. Insert or add item.
      let id = req.body.id;
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
      let parent = req.body.parent ? req.body.parent : 0;
      let query;
      let itemID = id && +ids[1] !== 0 ? +ids[1] : undefined;
      if (itemID !== undefined) {
        // Prefer the given id if there is one.
        query = "SELECT * FROM pieces WHERE id='" + itemID + "' AND user_id='" + user + "'";
      } else {
        // Otherwise look for an item with matching source.
        query = "SELECT * FROM pieces WHERE language='" + lang + "' AND user_id='" + user + "' AND src = '" + src + "' ORDER BY pieces.id";
      }
      dbQuery(query, function(err, result) {
        var row = result.rows[0];
        itemID = itemID ? itemID : row ? row.id : undefined;
        ast = ast ? JSON.parse(ast) : row && row.ast ? row.ast : null;
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
                res.sendStatus(400);
              } else {
                compileID(authToken, id, false, (err, obj) => {
                  console.log("PUT /comp?id=" + ids.join("+") + " (" + id + ") in " +
                              (new Date - t0) + "ms");
                  res.json({
                    id: id,
                    obj: obj,
                  });
                });
              }
            });
          } else {
            postItem(lang, rawSrc, ast, obj, user, parent, img, label, (err, result) => {
              if (err) {
                console.log("ERROR [2] PUT /compile err=" + err);
                response.sendStatus(400);
              } else {
                let langID = lang.charAt(0) === "L" ? +lang.substring(1) : +lang;
                let codeID = result.rows[0].id;
                let dataID = 0;
                let ids = [langID, codeID, dataID];
                let id = encodeID(ids);
                compileID(authToken, id, false, (err, obj) => {
                  console.log("PUT /comp?id=" + ids.join("+") + " (" + id + ")* in " +
                              (new Date - t0) + "ms");
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
    }
  });
});
const putData = (auth, data, resume) => {
  let t0 = new Date;
  let rawSrc = JSON.stringify(data) + "..";
  let src = cleanAndTrimSrc(rawSrc);
  let obj = JSON.stringify(data);
  let lang = "L113";
  let user = 0;
  let query =
    "SELECT * FROM pieces WHERE language='" + lang +
    "' AND src='" + src + "' LIMIT 1";
  dbQuery(query, function(err, result) {
    // See if there is already an item with the same source for the same
    // language. If so, pass it on.
    var row = result.rows[0];
    let itemID = row && row.id ? row.id : undefined;
    // Might still be undefined if there is no match.
    if (itemID) {
      var src = row.src;
      var ast = row.ast;
      var img = row.img;
      var label = row.label;
      updateItem(itemID, lang, rawSrc, ast, obj, img, function (err, data) {
        if (err) {
          console.log("[8] ERROR " + err);
        }
      });
      // Don't wait for update. We have what we need to respond.
      let langID = lang.charAt(0) === "L" ? +lang.substring(1) : +lang;
      let codeID = row.id;
      let dataID = 0;
      let ids = [langID, codeID, dataID];
      let id = encodeID(ids);
      resume(null, id);
    } else {
      var ast = null;
      var label = "data";
      var parent = 0;
      var img = "";
      postItem(lang, rawSrc, ast, obj, user, parent, img, label, (err, result) => {
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
            compileID(auth, id, false, (err, obj) => {
              console.log("putCode() id=" + ids.join("+") + " (" + id + ") in " +
                          (new Date - t0) + "ms");
              resume(null, {
                id: id,
                obj: obj,
              });
            });
          }
        });
      } else {
        postItem(lang, rawSrc, ast, obj, user, parent, img, label, (err, result) => {
          if (err) {
            console.log("ERROR [2] PUT /compile err=" + err);
            resume(400);
          } else {
            let langID = lang.charAt(0) === "L" ? +lang.substring(1) : +lang;
            let codeID = result.rows[0].id;
            let dataID = 0;
            let ids = [langID, codeID, dataID];
            let id = encodeID(ids);
            compileID(auth, id, false, (err, obj) => {
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
      var parent = body.parent ? body.parent : 0;
      var img = "";
      postItem(lang, rawSrc, ast, obj, user, parent, img, label, (err, result) => {
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
  let queryStr = "";
  if (req.query.list) {
    let list = req.query.list;
    queryStr =
      "SELECT * FROM pieces WHERE pieces.id" +
      " IN ("+list+") ORDER BY pieces.id DESC";
  } else if (req.query.where) {
    let fields = req.query.fields ? req.query.fields : "id";
    let limit = req.query.limit;
    let where = req.query.where;
    queryStr =
      "SELECT " + fields +
      " FROM pieces WHERE " + where +
      " ORDER BY pieces.id DESC" +
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
    res.send(rows)
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

app.get("/:lang/*", function (req, response) {
  // /L106/lexicon.js
  let lang = req.params.lang;
  pingLang(lang, pong => {
    if (pong) {
      let url = req.url;
      let path = url.substring(url.indexOf(lang) + lang.length + 1);
      var data = [];
      var options = {
        host: getCompilerHost(lang),
        port: getCompilerPort(lang),
        path: "/" + path,
      };
      req = protocol.get(options, function(res) {
        res.on("data", function (chunk) {
          data.push(chunk);
        }).on("end", function () {
          response.send(data.join(""));
        });
      });
    } else {
      response.sendStatus(404);
    }
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

let authToken;

if (!module.parent) {
  var port = process.env.PORT || 3000;
  app.listen(port, function() {
    console.log("Listening on " + port);
    console.log("Using address " + clientAddress);
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
    // recompileItems([
    // ]);
    // let browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
    // batchScrape(browser, [
    // ], 0, () => {
    //   browser.close();
    // });
    // putComp([], clientSecret);
    // clearCache("snap-base64-png");
  });
}

// Client URLs

app.get('/0xaE91FC0da6B3a5d9dB881531b5227ABE075a806B', function (req, res) {
  let secret = process.env.FIVESTARS_ARTCOMPILER_CLIENT_SECRET;
  if (secret) {
    res.send(secret);
  } else {
    res.sendStatus(404);
  }
});


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
      console.log("statusCode=" + res.statusCode);
      console.log("data=" + JSON.stringify(JSON.parse(data), null, 2));
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

