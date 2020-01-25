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
const cache = undefined; // = redis.createClient(process.env.REDIS_URL);
const atob = require("atob");
const {decodeID, encodeID} = require('./src/id');
const {
  cleanAndTrimObj,
  cleanAndTrimSrc,
  parseJSON,
} = require('./src/utils');
const main = require('./src/main');
const routes = require('./routes');
const {
  dbQuery,
  // Items
  insertItem,
  getLastItemByLang,
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
const DEBUG = process.env.DEBUG === 'true' || false;
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

app.set('views', __dirname + '/views');
// app.set('public', __dirname + '/public');
// app.set('public', __dirname + '/lib');
app.use(morgan('combined', {
  skip: function (req, res) { return res.statusCode < 400 }
}));

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
  res.sendStatus(200);
//   let proto = req.headers['x-forwarded-proto'] || "http";
//   if (aliases["home"]) {
//     request([proto, "://", "www.artcompiler.com", "/form?id=" + aliases["home"]].join("")).pipe(res);
//   } else {
//     request([proto, "://", "www.artcompiler.com", "/form?id=LO5SnPeAJhg"].join("")).pipe(res);
//   }
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
  if (!DEBUG && !dontCache.includes(lang)) {
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
  pingLang(lang, (pong) => {
    if (pong) {
      if (src) {
        putCode(authToken, lang, src, (err, val) => {
          if (err) {
            console.log(`ERROR GET /lang putCode err=${err.message}`);
            res.sendStatus(500);
          } else {
            res.redirect("/item?id=" + val.id);
          }
        });
        return;
      }
      getLastItemByLang(langID, (err, item) => {
        if (err) {
          console.log(`ERROR GET /lang getLastItemByLang err=${err.message}`);
          res.sendStatus(500);
        } else if (item) {
          res.redirect(`/item?id=${item.itemid}`);
        } else {
          postItem(lang, `| ${lang}`, null, null, 0, 0, null, 'show', 0, (err, itemID) => {
            if (err) {
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
            if (err) {
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
        if (err && err.length) {
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
  sendItem(req.query.id, req, res);
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
  const langID = ids[0] ? ids[0] : 0;
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
  sendForm(req.query.id, req, res);
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
    if (err) {
      if (err instanceof Error) {
        console.log(`ERROR GET /data?id=${ids.join('+')} (${id}) err=${err.message}`);
      } else {
        console.trace(err);
        console.log(`ERROR GET /data?id=${ids.join('+')} (${id}) err=${err}`);
      }
      res.sendStatus(400);
    } else {
      console.log("GET /data?id=" + ids.join("+") + " (" + id + ") in " +
                  (new Date - t0) + "ms" + (refresh ? " [refresh]" : ""));
      res.json(obj);
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
    if (err) {
      resume(err);
    } else {
      // Perform async update of the parent fork count
      incrementForks(parentID, (err, forks) => {
        if (err) {
          console.log(`ERROR postItem incrementForks err=${err.message}`);
        } else {
          console.log(`Updated parent[${parentID}] of piece[${piece.id}] forks to ${forks}`);
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
    if (err) {
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
      console.log(`Reparsing SRC: langID=${ids[0]} codeID=${ids[1]} src='${src}'`);
      parse(lang, src, (err, ast) => {
        updatePieceAST(ids[1], user, lang, ast, (err) => {
          if (err) {
            console.log(`ERROR getCode updatePieceAST err=${err.message}`);
          }
        });
        // Don't wait for update.
        if (err) {
          resume(err);
        } else {
          resume(null, ast);
        }
      });
    }
  });
}

function langName(id) {
  id = +id;
//  return 'L' + (id < 10 ? "00" + id : id < 100 ? "0" + id : id);
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
      if (err) {
        resume(err);
      } else if (val) {
        // Got cached value. We're done.
        resume(null, val);
      } else {
        const ids = decodeID(id);

        // Count every time code is used to compile a new item.
        incrementViews(ids[1], (err, views) => {
          if (err) {
            console.log(`ERROR compileID incrementViews err=${err.message}`);
          } else {
            console.log(`Updated piece[${ids[1]}] views to ${views}`);
          }
        });  

        getData(auth, ids, refresh, (err, data) => {
          if (err) {
            resume(err);
          } else {
            getCode(ids, refresh, (err, code) => {
              if (err) {
                resume(err);
              } else {
                getLang(ids, (err, lang) => {
                  if (err) {
                    resume(err);
                  } else {
                    if (lang === "L113" && Object.keys(data).length === 0) {
                      // No need to recompile.
                      getPiece(ids[1], (err, item) => {
                        if (err) {
                          resume(err);
                        } else {
                          try {
                            const obj = JSON.parse(item.obj);
                            setCache(lang, id, "data", obj);
                            resume(null, obj);
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
                      if (lang && code && code.root) {
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
                                updatePiece(ids[1], null, obj, null, (err) => {
                                  if (err) {
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

function parseID(id, options, resume) {
  const ids = decodeID(id);
  getPiece(ids[1], (err, item) => {
    if (err && err.length) {
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
  default:
    return null;
  }
}

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
      compileID(auth, id, {refresh: DEBUG}, (err, obj) => {
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
  const auth = req.headers.authorization;
  const date = new Date().toUTCString();
  postAuth("/validate", { jwt: auth }, (err, val) => {
    const t1 = new Date;
    console.log("postAuth() in " + (t1 - t0) + "ms");
    if (err) {
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
        const str = "grid [\n";
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

app.put('/compile', function (req, res) {
  // This end point is hit when code is edited. If the code already exists for
  // the current user, then recompile it and update the OBJ. If it doesn't exist
  // for the current user, then create a new item.
  const lang = req.body.language;
  const langID = lang.charAt(0) === 'L' ? +lang.substring(1) : +lang;
  const t0 = new Date;
  validateUser(req.body.jwt, lang, (err, data) => {
    if (err) {
      console.log(`ERROR PUT /compile validateUser err=${err.message}`);
      res.sendStatus(401);
    } else {
      // TODO user is known but might not have access to this operation. Check
      // user id against registered user table for this host.
      // Map AST or SRC into OBJ. Store OBJ and return ID.
      // Compile AST or SRC to OBJ. Insert or add item.
      const { forkID=0, src, ast, parent=0 } = req.body;
      const ip = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
      const user = +req.body.userID || dot2num(ip);  // Use IP address if userID not avaiable.
      if (!ast) {
        console.log(`No AST, parsing: ${src}`);
        // No AST, try creating from source.
        parse(lang, src, (err, ast) => {
          if (err) {
            console.log(`ERROR PUT /compile parse err=${err.message}`);
            res.sendStatus(400);
          } else {
            compile({ res, userID: user, lang, ast });
          }
        });
      } else {
        compile({ res, userID: user, lang, ast });
      }
      function compile({ res, userId, lang, ast }) {
        itemToID(userId, lang, ast, (err, itemID) => {
          if (err) {
            itemID = null;
          }
          compileInternal({ res, itemID });
        });
      }
      function compileInternal({ res, itemID }) {
        const img = '';
        const obj = '';
        const label = 'show';
        if (itemID) {
          const ids = [langID, itemID, 0];
          const id = encodeID(ids);
          updatePiece(itemID, src, obj, img, (err) => {
            if (err) {
              console.log(`ERROR PUT /compile updatePiece err=${err.message}`);
              res.sendStatus(500);
            } else {
              compileID(authToken, id, {refresh: true}, (err, obj) => {
                if (err) {
                  if (err instanceof Error) {
                    console.log(`ERROR PUT /compile compileID err=${err.message}`);
                  } else {
                    console.trace(err);
                  }
                  res.sendStatus(500);
                } else {
                  console.log(`PUT /compile?id=${ids.join('+')} (${id}) in ${(new Date - t0)}ms`);
                  res.json({ id, obj });
                }
              });
            }
          });
        } else {
          postItem(lang, src, ast, obj, user, parent, img, label, forkID, (err, codeID) => {
            if (err) {
              console.log(`ERROR PUT /compile postItem err=${err.message}`);
              res.sendStatus(500);
            } else {
              if (forkID === 0) {
                forkID = id;
              }
              const ids = [langID, codeID, 0];
              const id = encodeID(ids);
              compileID(authToken, id, {refresh: false}, (err, obj) => {
                if (err) {
                  console.log(`ERROR PUT /compile compileID err=${err.message}`);
                  res.sendStatus(500);
                } else {
                  console.log(`PUT /compile?id=${ids.join('+')} (${id}) in ${(new Date - t0)}ms`);
                  res.json({ forkID, id, obj });
                }
              });
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
  const ast = null;
  const label = "data";
  const parent = 0;
  const img = "";
  const forkID = 0;
  postItem(lang, rawSrc, ast, obj, user, parent, img, label, forkID, (err, codeID) => {
    const langID = lang.charAt(0) === 'L' ? +lang.substring(1) : +lang;
    const dataID = 0;
    const ids = [langID, codeID, dataID];
    const id = encodeID(ids);
    if (err) {
      console.log("ERROR putData() err=" + err);
      resume(err);
    } else {
      resume(null, id);
    }
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
    compile(ast);
  });
  function compile(ast) {
    const forkID = 0;
    postItem(lang, rawSrc, ast, obj, user, parent, img, label, forkID, (err, codeID) => {
      if (err) {
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
  const lang = language;
  const ids = id !== undefined ? decodeID(id) : [0, 0, 0];
  const ip = req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
  const user = req.body.userID || dot2num(ip);
  const itemID = id && +ids[1] !== 0 ? ids[1] : undefined;
  if (itemID !== undefined) {
    getPiece(itemID, (err, piece) => {
      let id = null;
      if (!err && piece) {
        id = piece.id;
      }
      insertOrUpdatePiece({ res, id, lang, src, obj, img });
    });
  } else {
    insertOrUpdatePiece({ res, id: null, lang, src, obj, img });
  }
  function insertOrUpdatePiece({ res, id, lang, src, obj, img }) {
    if (id) {
      // Perform async piece update
      updatePiece(id, src, obj, img, (err) => {
        if (err) {
          console.log(`ERROR PUT /code updatePiece err=${err.message}`);
        }
      });

      // Don't wait for update. We have what we need to respond.
      const langID = lang.charAt(0) === 'L' ? +lang.substring(1) : +lang;
      const codeID = id;
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
            if (err) {
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

app.get('/items', function(req, res) {
  const t0 = new Date;
  // Used by L109, L131.
  const userID = req.query.userID;
  let queryStr = "";
  const table = req.query.table || "pieces";
  if (req.query.list) {
    const list = req.query.list;
    queryStr =
      "SELECT * FROM " + table + " WHERE pieces.id" +
      " IN ("+list+") ORDER BY id DESC";
  } else if (req.query.where) {
    const fields = req.query.fields ? req.query.fields : "id";
    const limit = req.query.limit;
    const where = req.query.where;
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
    let rows;
    if (!result || result.rows.length === 0) {
      rows = [];
    } else {
      rows = result.rows;
    }
    const mark = req.query.stat && req.query.stat.mark;
    if (mark !== undefined) {
      dbQuery("SELECT codeid FROM items WHERE " +
              "userid='" + userID +
              "' AND mark='" + mark + "'",
              (err, result) => {
                const list = [];
                result.rows.forEach(row => {
                  list.push(row.codeid);
                });
                const selection = [];
                rows.forEach(row => {
                  if (list.includes(row.id)) {
                    selection.push(row);
                  }
                });
                console.log("GET /items selection=" + JSON.stringify(selection));
                res.send(selection)
              });
    } else {
      console.log("GET /items " + rows.length + " found, " + (new Date - t0) + "ms");
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
  const lang = req.params.lang;
  const search = req.query.src;
  let labelStr;
  if (req.query.label === undefined) {
    labelStr = " label='show' ";
  } else {
    const labels = req.query.label.split("|");
    labelStr = " (";
    labels.forEach(label => {
      if (labelStr !== " (") {
        labelStr += " OR ";
      }
      labelStr += " label='" + label + "' ";
    });
    labelStr += ") ";
  }
  let queryString;
  const likeStr = "";
  if (search) {
    const ss = search.split(",");
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
    let rows;
    if (!result || result.rows.length === 0) {
      console.log("no rows");
      // No rows for this language so make an empty item and insert it.
      const insertStr =
          "INSERT INTO pieces (user_id, parent_id, views, forks, created, src, obj, language, label, img)" +
          " VALUES ('" + 0 + "', '" + 0 + "', '" + 0 +
          " ', '" + 0 + "', now(), '" + "| " + lang + "', '" + "" +
          " ', '" + lang + "', '" + "show" + "', '" + "" + "');";
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

const assetCache = {};
app.get("/:lang/*", function (req, res) {
  // /L106/lexicon.js
  const lang = req.params.lang;
  const path = req.url;
  let data;
  if (!LOCAL_COMPILES && (data = assetCache[path])) {
    res.send(data);
  } else {
    pingLang(lang, (pong) => {
      if (pong) {
        const chunks = [];
        const options = {
          host: getAPIHost(lang),
          port: getAPIPort(lang),
          path: path,
        };
        const protocol = LOCAL_COMPILES && http || https;
        protocol.get(options, (apiRes) => {
          apiRes
            .on('error', (err) => {
              console.log(`ERROR GET /:lang/* api call err=${err.message}`);
              res.sendStatus(500);
            })
            .on('data', (chunk) => chunks.push(chunk))
            .on('end', () => {
              const data = assetCache[path] = chunks.join('');
              res.send(data);
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
  } else if (DEBUG || validatedUsers[token]) {
    const data = validatedUsers[token];
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
