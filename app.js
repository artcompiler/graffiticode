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
const redis = require('redis');
const cache = process.env.REDIS_URL && redis.createClient(process.env.REDIS_URL);
const atob = require("atob");
const cors = require('cors');
const {decodeID, encodeID} = require('./src/id');
const {
  cleanAndTrimObj,
  cleanAndTrimSrc,
  isNonEmptyString,
  parseJSON,
  statusCodeFromErrors,
  messageFromErrors,
} = require('./src/utils');
const main = require('./src/main');
const routes = require('./routes');
const {
  // Database
  dbQuery,
  readinessCheck,

  // Items
  insertItem,
  getLastItemByLang,
  getLastItemByLabel,

  // Pieces
  createPiece,
  getPiece,
  incrementForks,
  incrementViews,
  itemToID,
  updatePiece,
  updatePieceAST,
} = require('./src/storage');

// Configuration
const LOCAL_COMPILES = process.env.LOCAL_COMPILES === 'true' || false;
const API_HOST = process.env.API_HOST || "api.acx.ac";

const env = process.env.NODE_ENV || 'development';

app.all('*', function (req, res, next) {
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

if (env === 'development') {
  app.use(morgan('dev'));
  app.use(errorHandler({ dumpExceptions: true, showStack: true }));
} else {
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400,
  }));
  app.use(errorHandler());
}

app.set('views', __dirname + '/views');
// app.set('public', __dirname + '/public');
// app.set('public', __dirname + '/lib');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false, limit: 100000000 }));
app.use(bodyParser.text({limit: '50mb'}));
app.use(bodyParser.raw({limit: '50mb'}));
app.use(bodyParser.json({ type: 'application/json', limit: '50mb' }));
app.use(methodOverride());
app.use(express.static(__dirname + '/public'));
app.use('/lib', express.static(__dirname + '/lib'));
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.sendStatus(500);
});
app.engine('html', function (templateFile, options, callback) {
  fs.readFile(templateFile, function (err, templateData) {
    const template = _.template(String(templateData));
    callback(err, template(options));
  });
});

// Routes

// const request = require('request');
app.get("/", (req, res) => {
  console.log("GET / host=" + req.headers.host);
  if (req.headers.host === 'www.altalabs.tech') {
    res.redirect('https://www.altalabs.tech/form?label=altalabs-splash')
  } else {
    res.redirect(`https://${req.headers.host}/lang?id=0`);
  }
});

const aliases = {};
const localCache = {};

function delCache(id, type) {
  const key = id + type;
  delete localCache[key];
  if (cache) {
    cache.del(key);
  }
}

function renCache(id, oldType, newType) {
  const oldKey = id + oldType;
  const newKey = id + newType;
  localCache[newKey] = localCache[oldKey];
  delete localCache[oldKey];
  if (cache) {
    cache.rename(oldKey, newKey);
  }
}

function getKeys(filter, resume) {
  filter = filter || "*";
  cache.keys(filter, resume);
}

function getCache(id, type, resume) {
  const key = id + type;
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
}

const dontCache = ["L124"];

function setCache(lang, id, type, val) {
  if (!dontCache.includes(lang)) {
    const key = id + type;
    localCache[key] = val;
    if (cache) {
      cache.set(key, type === "data" ? JSON.stringify(val) : val);
    }
  }
}

const lexiconCache = new Map();

function parse(lang, src, resume) {
  if (lexiconCache.has(lang)) {
    main.parse(src, lexiconCache.get(lang), resume);
  } else {
    get(lang, 'lexicon.js', (err, data) => {
      if (err) {
        resume(err);
      } else {
        // TODO Make lexicon JSON.
        console.log("parse() data=" + data);
        const lstr = data.substring(data.indexOf("{"));
        const lexicon = JSON.parse(lstr);
        lexiconCache.set(lang, lexicon);
        main.parse(src, lexicon, resume);
      }
    });
  }
}

app.use('/label', routes.label(dbQuery));
app.use('/stat', routes.stat(dbQuery, insertItem));
app.get('/lang', sendLang);

function sendLang(req, res) {
  // /lang?id=106
  const id = req.query.id;
  const langID = id;
  const src = req.query.src;
  const lang = langName(langID);
  console.log('sendLang() langID=' + langID);
  pingLang(lang, (pong) => {
    if (pong) {
      if (src) {
        putCode(authToken, lang, src, (err, val) => {
          if (err && err.length) {
            console.log(`ERROR GET /lang putCode err=${err.message}`);
            res.sendStatus(500);
          } else {
            res.redirect("/item?id=" + val.id);
          }
        });
        return;
      }
      getLastItemByLang(langID, (err, item) => {
        if (err && err.length) {
          console.log(`ERROR GET /lang getLastItemByLang err=${err.message}`);
          res.sendStatus(500);
        } else if (item) {
          res.redirect(`/item?id=${item.itemid}`);
        } else {
          postItem(lang, `| ${lang}`, {}, null, 0, 0, null, 'show', 0, (err, itemID) => {
            if (err && err.length) {
              console.log(`ERROR GET /lang postItem err=${err.message}`);
              res.sendStatus(500);
            } else {
              const id = encodeID([langID, itemID, 0]);
              res.redirect(`/item?id=${id}`);
            }
          });
        }
      });
    } else {
      console.log("ERROR language not available: " + lang);
      res.sendStatus(404);
    }
  });
}

function sendItem(id, req, res) {
  if (req.query.alias) {
    aliases[req.query.alias] = id;
  }
  const ids = decodeID(id);
  if (ids[1] === 0 && aliases[id]) {
    // ID is an invalid ID but a valid alias, so get aliased ID.
    ids = decodeID(aliases[id]);
  }
  // If forkID then getTip()
  const t0 = new Date;
  getTip(id, (err, tip) => {
    let langID = ids[0];
    const codeID = tip || ids[1];
    const dataIDs = ids.slice(2);
    if (req.query.fork) {
      // Create a new fork.
      getPiece(codeID, (err, row) => {
        if (err && err.length) {
          console.log("[1] GET /item ERROR 404 ");
          res.sendStatus(404);
        } else {
          langID = langID || +row.language.slice(1);
          const language = 'L' + langID;
          const src = row.src;
          const ast = row.ast;
          const obj = row.obj;
          const userID = row.user_id;
          const parentID = codeID;
          const img = row.img;
          const label = row.label;
          const forkID = 0;
          postItem(language, src, ast, obj, userID, parentID, img, label, forkID, (err, codeID) => {
            const ids = [langID, codeID].concat(dataIDs);
            if (err && err.length) {
              console.log("ERROR putData() err=" + err);
              res.sendStatus(400);
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
      getPiece(codeID, (err, row) => {
        if (!row || err && err.length) {
          console.log("ERROR [1] GET /item");
          res.sendStatus(404);
        } else {
          const rowLangID = langID || +row.language.slice(1);
          const language = 'L' + rowLangID;
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
}

app.get("/item", function (req, res) {
  if (req.query.id) {
    sendItem(req.query.id, req, res);
  } else if (req.query.label) {
    // Try to find an ID.
    getLastItemByLabel(req.query.label, (err, item) => {
      if (err && err.length || !item) {
        console.log(`ERROR GET /lang getLastItemByLabel err=${err.message} item=${JSON.stringify(item)}`);
        res.sendStatus(500);
      } else if (item) {
        res.redirect(`/item?id=${item.itemid}`);
      }
    });
  } else {
    res.sendStatus(500);
  }
});

// app.get("/i/:id", function (req, res) {
//   sendItem(req.params.id, req, res);
// });

function sendForm(id, req, res) {
  const ids = decodeID(id);
  if (ids[1] === 0 && aliases[id]) {
    // ID is an invalid ID but a valid alias, so get aliased ID.
    ids = decodeID(aliases[id]);
  }
  let langID = ids[0] ? ids[0] : 0;
  const codeID = ids[1] ? ids[1] : 0;
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
    const lang = langName(langID);
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
    getPiece(codeID, function(err, row) {
      if (!row) {
        console.log("ERROR [2] GET /form");
        res.sendStatus(404);
      } else {
        const lang = row.language;
        langID = lang.charAt(0) === 'L' ? lang.substring(1) : lang;
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
}

app.get("/form", function (req, res) {
  if (req.query.id) {
    sendForm(req.query.id, req, res);
  } else if (req.query.label) {
    // Try to find an ID.
    getLastItemByLabel(req.query.label, (err, item) => {
      if (err && err.length || !item) {
        res.sendStatus(500);
      } else if (item) {
        res.redirect(`/form?id=${item.itemid}`);
      }
    });
  } else {
    res.sendStatus(500);
  }
});

// app.get("/f/:id", function (req, res) {
//   sendForm(req.params.id, req, res);
// });

function sendData(auth, id, req, res) {
  const ids = decodeID(id);
  const refresh = !!req.query.refresh;
  const dontSave = !!req.query.dontSave;
  const options = {
    refresh: refresh,
    dontSave: dontSave,
  };
  const t0 = new Date;
  compileID(auth, id, options, (err, obj) => {
    if (err && err.length) {
      console.trace(err);
      console.log(`ERROR GET /data?id=${ids.join('+')} (${id}) err=${JSON.stringify(err)} obj=${JSON.stringify(obj)}`);
      const statusCode = statusCodeFromErrors(err);
      res.sendStatus(statusCode);
    } else {
      console.log("GET /data?id=" + ids.join("+") + " (" + id + ") in " +
                  (new Date - t0) + "ms" + (refresh ? " [refresh]" : ""));
      res.setHeader("server", "graffiticode/1.0");
      res.status(200).json(obj);
    }
  });
}

app.get("/data", (req, res) => {
  sendData(authToken, req.query.id, req, res);
});

app.get("/d/:id", (req, res) => {
  sendData(authToken, req.params.id, req, res);
});

function sendCode(id, req, res) {
  // Send the source code for an item.
  const ids = decodeID(id);
  const langID = ids[0];
  const codeID = ids[1];
  getPiece(codeID, (err, row) => {
    if (!row) {
      console.log("ERROR [1] GET /code");
      res.sendStatus(404);
    } else {
      res.json({
        src: row.src,
        ast: typeof row.ast === "string" && JSON.parse(row.ast) || row.ast,
      });
    }
  });
}

app.get('/code', (req, res) => {
  sendCode(req.query.id, req, res);
});

app.get("/c/:id", (req, res) => {
  sendCode(req.params.id, req, res);
});

const pingCache = {};

function pingLang(lang, resume) {
  if (pingCache[lang]) {
    resume(true);
  } else {
    const options = {
      method: 'GET',
      host: getAPIHost(lang),
      port: getAPIPort(lang),
      path: '/lang?id=' + lang.slice(1),
    };
    const protocol = LOCAL_COMPILES && http || https;
    const req = protocol.request(options, function(r) {
      const pong = r.statusCode === 200;
      if (!pong) {
        console.log("ERROR Language not found: " + lang);
      }
      pingCache[lang] = pong;
      resume(pong);
    }).on("error", (e) => {
      console.log("ERROR pingLang() e=" + JSON.stringify(e));
      resume(false);
    }).end();
  }
}

function get(language, path, resume) {
  const data = [];
  const options = {
    host: getAPIHost(language),
    port: getAPIPort(language),
    path: `/${language}/${path}`,
  };
  const protocol = LOCAL_COMPILES && http || https;
  protocol.get(options, (res) => {
    res.on('data', (chunk) => data.push(chunk))
      .on('end', () => resume(null, data.join('')))
      .on('error', resume);
  });
}

function postItem(lang, src, ast, obj, userID, parent, img, label, forkID, resume) {
  const parentID = decodeID(parent)[1];
  createPiece(forkID, parentID, userID, src, obj, lang, label, img, clientAddress, ast, (err, piece) => {
    if (err && err.length) {
      resume(err);
    } else {
      // Perform async update of the parent fork count
      incrementForks(parentID, (err, forks) => {
        if (err && err.length) {
          console.log(`ERROR postItem incrementForks err=${err.message}`);
        } else {
          // console.log(`Updated parent[${parentID}] of piece[${piece.id}] forks to ${forks}`);
        }
      });
      resume(null, piece.id);
    }
  });
}

const nilID = encodeID([0,0,0]);

function getData(auth, ids, refresh, resume) {
  if (encodeID(ids) === nilID || ids.length === 3 && +ids[2] === 0) {
    resume(null, {});
  } else {
    // Compile the tail.
    const id = encodeID(ids.slice(2));
    compileID(auth, id, {refresh: refresh}, resume);
  }
}

function getCode(ids, refresh, resume) {
  getPiece(ids[1], (err, item) => {
    if (err && err.length) {
      resume(err);
    } else if (!refresh && item && item.ast) {
      // if L113 there is no AST.
      const ast = typeof item.ast === "string" && JSON.parse(item.ast) || item.ast;
      resume(null, ast);
    } else {
      assert(item, `ERROR getCode() item not found: ${ids}`);
      const user = item.user_id;
      const lang = item.language;
      const src = item.src; //.replace(/\\\\/g, "\\");
//      console.log(`Reparsing SRC: langID=${ids[0]} codeID=${ids[1]} src="${src}"`);
      parse(lang, src, (err, ast) => {
        if (ast) {
          updatePieceAST(ids[1], user, lang, ast, (err) => {
            if (err && err.length) {
              console.log(`ERROR getCode updatePieceAST err=${err.message}`);
            }
          });
        }
        // Don't wait for update.
        if (err && err.length) {
          resume([{
            statusCode: 400,
            error: "Syntax error",
          }]);
        } else {
          resume(null, ast);
        }
      });
    }
  });
}

function langName(id) {
  id = +id;
  return 'L' + id;
}

function getLang(ids, resume) {
  const langID = ids[0];
  if (langID !== 0) {
    resume(null, langName(langID));
  } else {
    // Get the language name from the item.
    getPiece(ids[1], (err, item) => {
      resume(err, item.language);
    });
  }
}

function compileID(auth, id, options, resume) {
  const refresh = options.refresh;
  const dontSave = options.dontSave;
  if (id === nilID) {
    resume(null, {});
  } else {
    if (refresh) {
      delCache(id, "data");
    }
    getCache(id, "data", (err, val) => {
      if (err && err.length) {
        resume(err);
      } else if (val) {
        // Got cached value. We're done.
        resume(null, val);
      } else {
        const ids = decodeID(id);
        // Count every time code is used to compile a new item.
        incrementViews(ids[1], (err, views) => {
          if (err && err.length) {
            console.log(`ERROR compileID incrementViews err=${err.message}`);
          } else {
            // console.log(`Updated piece[${ids[1]}] views to ${views}`);
          }
        });
        getData(auth, ids, refresh, (err, data) => {
          if (err && err.length) {
            resume(err);
          } else {
            getCode(ids, refresh, (err, code) => {
              if (err && err.length) {
                resume(err);
              } else {
                getLang(ids, (err, lang) => {
                  if (err && err.length) {
                    resume(err);
                  } else {
                    if (lang === "L113" && Object.keys(data).length === 0) {
                      // No need to recompile.
                      getPiece(ids[1], (err, item) => {
                        if (err && err.length) {
                          resume(err);
                        } else {
                          try {
                            const obj = JSON.parse(item.obj);
                            setCache(lang, id, "data", obj);
                            resume(null, obj);
                          } catch (e) {
                            console.log("ERROR compileID() e=" + e);
                            // Oops. Missing or invalid obj, so need to recompile after all.
                            // Let downstream compilers know they need to refresh
                            // any data used. Prefer true over false.
                            comp(auth, lang, code, data, options, (err, obj) => {
                              if (err && err.length) {
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
                      if (lang && code && code.root) {
                        assert(code.root !== undefined, "Invalid code for item " + ids[1]);
                        // Let downstream compilers know they need to refresh
                        // any data used.
                        comp(auth, lang, code, data, options, (err, obj) => {
                          if (err && err.length) {
                            resume(err);
                          } else {
                            if (!dontSave) {
                              setCache(lang, id, "data", obj);
                              if (ids[2] === 0 && ids.length === 3) {
                                // If this is pure code, then update OBJ.
                                updatePiece(ids[1], null, obj, null, (err) => {
                                  if (err && err.length) {
                                    console.log(`ERROR compileID updatePiece err=${err.message}`);
                                  }
                                });
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
          }
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
      const langID = lang.indexOf('L') === 0 && lang.slice(1) || lang;
      const encodedData = JSON.stringify({
        "item": {
          lang: langID,
          code: code,
          data: data,
          options: options,
        },
        config: config,
        auth: auth,
      });
      const reqOptions = {
        host: getAPIHost(lang),
        port: getAPIPort(lang),
        path: "/compile",
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(encodedData),
        },
      };
      const protocol = LOCAL_COMPILES && http || https;
      const req = protocol.request(reqOptions, function(res) {
        let data = "";
        res.on('data', function (chunk) {
          data += chunk;
        });
        res.on('end', function () {
          const err = [];
          if (res.statusCode !== 200) {
            err.push({
              statusCode: res.statusCode,
              data: data,
            });
            resume(err, data);
          } else {
            resume(err, parseJSON(data));
          }
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

function parseID(id, options, resume) {
  const ids = decodeID(id);
  getPiece(ids[1], (err, item) => {
    if (err) {
      resume(err, null);
    } else {
      // if L113 there is no AST.
      const user = item.user_id;
      const lang = item.language;
      const src = item.src;
      if (src) {
        parse(lang, src, (err, ast) => {
          if (err) {
            resume(err);
          } else {
            if (!ast || Object.keys(ast).length === 0) {
              console.log(`NO AST for src=${src}`);
            }
            if (JSON.stringify(ast) !== JSON.stringify(item.ast)) {
              if (ids[1] && !options.dontSave) {
                console.log(`Saving AST for id=${id}`);
                updatePieceAST(ids[1], user, lang, ast, (err) => {
                  if (err) {
                    resume(err);
                  } else {
                    resume(null, ast);
                  }
                });
              } else {
                resume(null, ast);
              }
            } else {
              resume(null, ast);
            }
          }
        });
      } else {
        resume(new Error(`no source for id(${id})`));
      }
    }
  });
}

function clearCache(type, items) {
  getKeys("*" + type, (err, keys) => {
    items = items || keys;
    const count = 0;
    items.forEach((item) => {
      item = item.indexOf(type) < 0 ? item + type : item; // Append type of not present.
      if (keys.indexOf(item) >= 0) {
        console.log("deleting " + (++count) + " of " + keys.length + ": " + item);
        delCache(item.slice(0, item.indexOf(type)), type);
      } else {
        console.log("unknown " + item);
      }
    });
  });
}

function getIDFromType(type) {
  // FIXME make this generic.
  switch (type) {
  case 'deaths-28-d':
    return '3L5hj7WQwf0';
  default:
    return null;
  }
}

const REFRESH = true;

function batchCompile(auth, items, index, res, resume) {
  index = +index || 0;
  // For each item, get the dataID and concat with codeID of alias.
  if (index < items.length) {
    res && res.write(" ");
    const t0 = new Date;
    const item = items[index];
    const codeID = item.id || getIDFromType(item.type);
    const data = item.data;
    putData(auth, data, (err, dataID) => {
      const codeIDs = decodeID(codeID);
      const dataIDs = decodeID(dataID);
      const id = encodeID(codeIDs.slice(0,2).concat(dataIDs));
      item.id = id;
      item.image_url = "https://cdn.acx.ac/" + id + ".png";
      delete item.data;
      compileID(auth, id, {refresh: REFRESH}, (err, obj) => {
        item.data = obj;
        batchCompile(auth, items, index + 1, res, resume);
        console.log("COMPILE " + (index + 1) + "/" + items.length + ", " + id + " in " + (new Date - t0) + "ms");
      });
    });
  } else {
    resume(null, items);
  }
}

app.put('/comp', function (req, res) {
  const t0 = new Date;
  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const data = body;
  console.log("PUT /comp data=" + JSON.stringify(data));
  const auth = req.headers.authorization;
  const date = new Date().toUTCString();
  postAuth("/validate", { jwt: auth }, (err, val) => {
    const t1 = new Date;
    console.log("postAuth() in " + (t1 - t0) + "ms");
    if (err && err.length) {
      res.sendStatus(err);
    } else {
      const address = val.address;
      const t2 = new Date;
      res.writeHead(202, {"Content-Type": "application/json"});
      batchCompile(auth, data, 0, res, (err, data) => {
        const t3 = new Date;
        console.log("batchCompile() in " + (t3 - t2) + "ms");
        res.end(JSON.stringify(data));
        const itemIDs = [];
        let str = "grid [\n";
        str += 'row twelve-columns [br, ';
        str += 'style { "fontSize": "14"} cspan "Client: ' + address + '", ';
        str += 'style { "fontSize": "14"} cspan "Posted: ' + date + '"';
        str += '],\n';
        let doScrape;
        data.forEach((val, i) => {
          itemIDs.push(val.id);
          const langID = decodeID(val.id)[0];
          if (langID === 104) {
            str +=
            'row twelve-columns [href "item?id=' + val.id +
              '" img "https://cdn.acx.ac/' + val.id + '.png", h4 "' + (i + 1) +
              '" img "https://gc.acx.ac/form?id=' + val.id + ', h4 "' + (i + 1) +
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
  // FIXME This is broken. The logic doesn't make sense. And its super slow.
  const t0 = new Date;
  const [langID, codeID, dataID] = decodeID(id);
  // -- If is 0 then return 0.
  // -- If is forkID the return last item in fork or the original codeID if none.
  // -- If is not a forkID then return original codeID.
  if (!id || codeID === 0) {
    resume(null, 0);
  // } else if (langID === 0 && dataID === 0) {
  //   // A forkID is just 0+codeID+0 for the root item of the fork. So if there
  //   // is no items with that forkID just return the itemID.
  //   const query =
  //     "SELECT id FROM pieces WHERE fork_id=" + codeID +
  //     " ORDER BY id DESC LIMIT 1";
  //   dbQuery(query, function(err, result) {
  //     const t1 = new Date;
  //     resume(null, result.rows.length === 0 && codeID || result.rows[0].id || 0);
  //   });
  } else {
    // Not a forkID so just return the codeID.
    resume(null, codeID);
  }
}

app.post('/code', function (req, res) {
  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const lang = body.language;
  const langID = lang.charAt(0) === 'L' ? +lang.substring(1) : +lang;
  const t0 = new Date;
  validateUser(body.jwt, lang, (err, data) => {
    if (err && err.length) {
      console.log(`ERROR POST /code validateUser err=${err.message}`);
      res.sendStatus(401);
    } else {
      // TODO user is known but might not have access to this operation. Check
      // user id against registered user table for this host.
      // Map AST or SRC into OBJ. Store OBJ and return ID.
      // Compile AST or SRC to OBJ. Insert or add item.
      const { forkID=0, src, ast, parent=0 } = body;
      const ip = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
      const user = +body.userID || dot2num(ip);  // Use IP address if userID not avaiable.
      itemToID(user, lang, ast, (err, itemID) => {
        if (err) {
          itemID = null;
        }
        compileInternal({ res, itemID });
      });
      function compileInternal({ res, itemID }) {
        const img = '';
        const obj = '';
        const label = 'show';
        if (itemID) {
          const ids = [langID, itemID, 0];
          const id = encodeID(ids);
          updatePieceAST(itemID, user, lang, ast, (err) => {
            if (err && err.length) {
              console.log(`ERROR POST /code updatePiece err=${err.message}`);
              res.sendStatus(500);
            } else {
              console.log(`POST /code?id=${ids.join('+')} (${id}) in ${(new Date - t0)}ms (update)`);
              res.json({id});
            }
          });
        } else {
          postItem(lang, src, ast, obj, user, parent, img, label, forkID, (err, codeID) => {
            if (err && err.length) {
              console.log(`ERROR POST /code postItem err=${err.message}`);
              res.sendStatus(500);
            } else {
              if (forkID === 0) {
                forkID = id;
              }
              const ids = [langID, codeID, 0];
              const id = encodeID(ids);
              console.log(`POST /code?id=${ids.join('+')} (${id}) in ${(new Date - t0)}ms (post)`);
              res.json({forkID, id});
            }
          });
        }
      }
    }
  });
});
function putData(auth, data, resume) {
  if (!data || !Object.keys(data).length) {
    resume(null, undefined);
    return;
  }
  const t0 = new Date;
  const rawSrc = JSON.stringify(data) + "..";
  const src = cleanAndTrimSrc(rawSrc);
  const obj = cleanAndTrimObj(JSON.stringify(data));
  const lang = "L113";
  const user = 0;
  const label = "data";
  const parent = 0;
  const img = "";
  const forkID = 0;
  parse(lang, rawSrc, (err, ast) => {
    postItem(lang, rawSrc, ast, obj, user, parent, img, label, forkID, (err, codeID) => {
      const langID = lang.charAt(0) === 'L' ? +lang.substring(1) : +lang;
      const dataID = 0;
      const ids = [langID, codeID, dataID];
      const id = encodeID(ids);
      if (err && err.length) {
        console.log("ERROR putData() err=" + err);
        resume(err);
      } else {
        resume(null, id);
      }
    });
  });
}
function putCode(auth, lang, rawSrc, resume) {
  const t0 = new Date;
  // Compile AST or SRC to OBJ. Insert or add item.
  const src = cleanAndTrimSrc(rawSrc);
  const user = 0;
  const img = "";
  const obj = "";
  const label = "show";
  const parent = 0;
  parse(lang, rawSrc, (err, ast) => {
    if (err) {
      resume(err);
    } else {
      compile(ast);
    }
  });
  function compile(ast) {
    const forkID = 0;
    postItem(lang, rawSrc, ast, obj, user, parent, img, label, forkID, (err, codeID) => {
      if (err && err.length) {
        console.log("ERROR [2] PUT /compile err=" + err);
        resume(400);
      } else {
        const langID = lang.charAt(0) === 'L' ? +lang.substring(1) : +lang;
        const dataID = 0;
        const ids = [langID, codeID, dataID];
        const id = encodeID(ids);
        compileID(auth, id, {}, (err, obj) => {
          console.log("putCode() id=" + ids.join("+") + " (" + id + ")* in " +
                      (new Date - t0) + "ms");
          resume(null, {id, obj});
        });
      }
    });
  }
}
app.put('/code', (req, res) => {
  // Insert or update code without recompiling.
  const t0 = new Date;
  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { id, language, src, obj, img } = body;
  const ids = id !== undefined ? decodeID(id) : [0, 0, 0];
  const ip = req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
  const user = req.body.userID || dot2num(ip);
  const itemID = id && +ids[1] !== 0 ? ids[1] : undefined;
  let lang = language;
  if (itemID !== undefined) {
    getPiece(itemID, (err, piece) => {
      let pieceId = null;
      if (!err && piece) {
        pieceId = piece.id;
        lang = piece.language;
      }
      insertOrUpdatePiece(res, pieceId, lang, src, obj, img);
    });
  } else {
    insertOrUpdatePiece(res, null, lang, src, obj, img);
  }
  function insertOrUpdatePiece(res, pieceId, lang, src, obj, img) {
    if (pieceId) {
      // Perform async piece update
      updatePiece(pieceId, src, obj, img, (err) => {
        if (err && err.length) {
          console.log(`ERROR PUT /code updatePiece err=${err.message}`);
        }
      });

      // Don't wait for update. We have what we need to respond.
      const langID = lang.charAt(0) === 'L' ? +lang.substring(1) : +lang;
      const codeID = pieceId;
      const dataID = 0;
      const ids = [langID, codeID, dataID];
      const id = encodeID(ids);
      console.log(`PUT /code?id=${ids.join('+')} (${id}) in ${(new Date - t0)}ms`);
      res.status(200).json({ id });
    } else {
      const label = body.label;
      const parent = body.parent ? body.parent : 0;
      parse(lang, src, (err, ast) => {
        if (err) {
          console.log(`ERROR PUT /code parse err=${err.message}`);
          res.sendStatus(500);
        } else {
          postItem(lang, src, ast, obj, user, parent, '', label, 0, (err, codeID) => {
            if (err && err.length) {
              console.log(`ERROR PUT /code postItem err=${err.message}`);
              res.sendStatus(500);
            } else {
              const langID = lang.charAt(0) === 'L' ? +lang.substring(1) : +lang;
              const dataID = 0;
              const ids = [langID, codeID, dataID];
              const id = encodeID(ids);
              console.log(`PUT /code?id=${ids.join('+')} (${id}) in ${(new Date - t0)}ms`);
              res.status(200).json({ id });
            }
          });
        }
      });
    }
  }
});

const ALLOWED_TABLES = ['pieces', 'items'];
app.get('/items', (req, res) => {
  const t0 = new Date;
  // Used by L109, L131.
  let { table='pieces', list, where='', fields='id', limit='100000', userID, mark } = req.query;
  mark = Number.parseInt(mark);
  if (!isNonEmptyString(list) && !isNonEmptyString(where) && !Number.isInteger(mark)) {
    return res.status(400).json({
      success: false,
      errors: ['must specify list, where, or mark'],
      data: null,
    });
  }
  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({
      success: false,
      errors: [`table must be one of ${ALLOWED_TABLES.join(',')}`],
      data: null,
    });
  }
  limit = Number.parseInt(limit);
  if (!Number.isInteger(limit)) {
    return res.status(400).json({
      success: false,
      errors: ['limit must be an integer'],
      data: null,
    });
  }
  if(limit < 1 || limit > 100000) {
    return res.status(400).json({
      success: false,
      errors: ['limit must be between 1 and 100000'],
      data: null,
    });
  }
  if (Number.isInteger(mark)) {
    userID = Number.parseInt(userID);
    if (!Number.isInteger(userID)) {
      return res.status(400).json({
        success: false,
        errors: ['userID must be an integer'],
        data: null,
      });
    }
    if(userID < 0) {
      return res.status(400).json({
        success: false,
        errors: ['userID must be a positive integer'],
        data: null,
      });
    }
    if (table === 'pieces') {
      table += ' AS p, items AS i';
      if (fields.split(',').includes('id')) {
        const temp = fields.split(',').filter(f => f !== 'id');
        temp.unshift('p.id');
        fields = temp.join(',');
      }
      if (isNonEmptyString(where)) {
        where = `(${where}) AND i.codeid = p.id`;
      } else {
        where = 'i.codeid = p.id';
      }
    }
    where = `(${where}) AND mark=${mark} AND userid=${userID}`;
  }
  if (isNonEmptyString(list)) {
    if (isNonEmptyString(where)) {
      where = `(${where}) AND id IN (${list})`;
    } else {
      where = `id IN (${list})`;
    }
  }
  const query = `
  SELECT ${fields}
  FROM ${table}
  ${isNonEmptyString(where) ? `WHERE ${where}`: ''}
  ORDER BY id DESC
  LIMIT ${limit};
  `;
  dbQuery(query, (err, result) => {
    if (err && err.length) {
      res.status(500).send({
        success: false,
        errors: [err.message],
        data: null,
      });
    } else {
      console.log(`GET /items ${result.rows.length} found, ${(new Date - t0)}ms`);
      res.status(200).json({
        success: true,
        errors: [],
        data: result.rows,
      });
    }
  });
});

// From http://javascript.about.com/library/blipconvert.htm
function dot2num(dot) {
  const d = dot.split('.');
  const n = ((((((+d[0])*256)+(+d[1]))*256)+(+d[2]))*256)+(+d[3]);
  if (isNaN(n)) {
    return 0;
  }
  return n;
}
function num2dot(num) {
  const d = num%256;
  for (const i = 3; i > 0; i--) {
    num = Math.floor(num/256);
    d = num%256 + '.' + d;}
  return d;
}

const assetCache = new Map();
const assetCacheTtlMs = 5 * 60 * 1000;
app.get('/:lang/*', (req, res) => {
  // /L106/lexicon.js
  const lang = req.params.lang;
  const path = req.url;
  if (!LOCAL_COMPILES && assetCache.has(path)) {
    res.send(assetCache.get(path));
  } else {
    pingLang(lang, (pong) => {
      if (pong) {
        const options = {
          host: getAPIHost(lang),
          port: getAPIPort(lang),
          path: path,
        };
        const protocol = LOCAL_COMPILES && http || https;
        protocol.get(options, (apiRes) => {
          const chunks = [];
          apiRes
            .on('error', (err) => {
              console.log(`ERROR GET /${lang}/ api call err=${err.message}`);
              res.sendStatus(500);
            })
            .on('data', (chunk) => chunks.push(chunk))
            .on('end', () => {
              const data = chunks.join('');
              // Only save if request is not an error
              if (apiRes.statusCode < 400) {
                assetCache.set(path, data);
                setTimeout(() => assetCache.delete(path), assetCacheTtlMs);
              }
              res.status(apiRes.statusCode).send(data);
            });
        });
      } else {
        res.sendStatus(404);
      }
    });
  }
});

function getAPIHost(lang, options) {
  if (LOCAL_COMPILES) {
    return "localhost";
  } else {
    return API_HOST;
  }
}

function getAPIPort(lang) {
  if (LOCAL_COMPILES) {
    return "3100";
  } else {
    return "443";
  }
}

readinessCheck((err) => {
  if (err) {
    console.log(`ERROR Database is not ready: ${err.message}`);
    process.exit(1);
  } else {
    console.log(`Database is ready`);
  }
});

process.on('uncaughtException', (err) => {
  if (err instanceof Error) {
    console.log(`ERROR Uncaught exception: ${err.stack}`);
  } else {
    console.trace(`ERROR Uncaught exception: "${err}"`);
  }
});

function postAuth(path, data, resume) {
  const encodedData = JSON.stringify(data);
  const options = {
    host: "auth.artcompiler.com",
    port: "443",
    path: path,
    method: "POST",
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(encodedData),
    },
  };
  const req = https.request(options);
  req.on("response", (res) => {
    let data = "";
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
  } else {
    postAuth("/validateSignIn", {
      jwt: token,
    }, (err, data) => {
      if (err && err.length) {
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
  const port = process.env.PORT || 3000;
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
  const encodedData = JSON.stringify(data);
  const options = {
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
  const req = https.request(options);
  req.on("response", (res) => {
    let data = "";
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
