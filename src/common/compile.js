exports.buildCompileID = ({
  log,
  nilID,
  decodeID,
  getCache,
  setCache,
  delCache,
  incrementViews,
  getPiece,
  updatePiece,
  getData,
  getCode,
  getLang,
  compile,
}) => {
  return function compileID(auth, id, options, resume) {
    const refresh = options.refresh;
    const dontSave = options.dontSave;
    if (id === nilID) {
      resume(null, {});
    } else {
      if (refresh) {
        delCache(id, 'data');
      }
      getCache(id, 'data', (err, val) => {
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
              log(`ERROR compileID incrementViews err=${err.message}`);
            }
          });

          Promise.all([
            new Promise((resolve, reject) => {
              getData(auth, ids, refresh, (err, data) => {
                if (err && err.length) {
                  reject(err);
                } else {
                  resolve(data);
                }
              });
            }),
            new Promise((resolve, reject) => {
              getCode(ids, refresh, (err, code) => {
                if (err && err.length) {
                  reject(err);
                } else {
                  resolve(code);
                }
              });
            }),
            new Promise((resolve, reject) => {
              getLang(ids, (err, lang) => {
                if (err && err.length) {
                  reject(err);
                } else {
                  resolve(lang);
                }
              });
            }),
          ])
          .then(([data, code, lang]) => {
            if (lang === 'L113' && Object.keys(data).length === 0) {
              // No need to recompile.
              getPiece(ids[1], (err, item) => {
                if (err && err.length) {
                  resume(err);
                } else {
                  try {
                    const obj = JSON.parse(item.obj);
                    setCache(lang, id, 'data', obj);
                    resume(null, obj);
                  } catch (e) {
                    log('ERROR compileID() e=' + e);
                    // Oops. Missing or invalid obj, so need to recompile after all.
                    // Let downstream compilers know they need to refresh
                    // any data used. Prefer true over false.
                    compile(auth, lang, code, data, options, (err, obj) => {
                      if (err && err.length) {
                        resume(err);
                      } else {
                        setCache(lang, id, 'data', obj);
                        resume(null, obj);
                      }
                    });
                  }
                }
              });
            } else {
              if (lang && code && code.root) {
                compile(auth, lang, code, data, options, (err, obj) => {
                  if (err && err.length) {
                    resume(err);
                  } else {
                    if (!dontSave) {
                      setCache(lang, id, 'data', obj);
                      if (ids[2] === 0 && ids.length === 3) {
                        // If this is pure code, then update OBJ.
                        updatePiece(ids[1], null, obj, null, (err) => {
                          if (err && err.length) {
                            log(`ERROR compileID updatePiece err=${err.message}`);
                          }
                        });
                      }
                    }
                    resume(null, obj);
                  }
                });
              } else {
                // Error handling here.
                log('ERROR compileID() ids=' + ids + ' missing code');
                resume(null, {});
              }
            }
          })
          .catch(resume);
        }
      });
    }
  };
};
