function buildCompile({
  pingLang,
  postJSON,
}) {
  return function compile(auth, lang, code, data, options, resume) {
    pingLang(lang, async (pong) => {
      if (pong) {
        try {
          const config = {};
          const langID = lang.indexOf('L') === 0 && lang.slice(1) || lang;
          const req = {
            auth,
            config,
            item: {
              lang: langID,
              code,
              data,
              options,
            },
          };
          const res = await postJSON('/compile', req);
          resume(null, res);
        } catch(err) {
          // TODO translate to status code
          resume([{ error: err.message, statusCode: err.statusCode || 500 }]);
        }
      } else {
        resume([{ error: `language ${lang} unreachable`, statusCode: 404 }]);
      }
    });
  };
}
exports.buildCompile = buildCompile;
