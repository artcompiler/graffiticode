exports.buildParse = ({
  log,
  cache,
  getLangAsset,
  main,
}) => {
  return function parse(lang, src, resume) {
    if (cache.has(lang)) {
      main.parse(src, cache.get(lang), resume);
    } else {
      getLangAsset(lang, 'lexicon.js', (err, data) => {
        if (err) {
          resume(err);
        } else {
          // TODO Make lexicon JSON.
          log('parse() data=' + data);
          const lstr = data.substring(data.indexOf('{'));
          const lexicon = JSON.parse(lstr);
          cache.set(lang, lexicon);
          main.parse(src, lexicon, resume);
        }
      });
    }
  };
};
