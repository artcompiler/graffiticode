const vm = require('vm');

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
          return;
        }
        // TODO Make lexicon JSON.
        if (data instanceof Buffer) {
          data = data.toString();
        }
        if (typeof(data) !== 'string') {
          log(`Failed to get usable lexicon for ${lang}`, typeof(data), data);
          resume(new Error(`unable to use lexicon`));
          return;
        }

        const lstr = data.substring(data.indexOf('{'));
        let lexicon;
        try {
          lexicon = JSON.parse(lstr);
        } catch (err) {
          if (err instanceof SyntaxError) {
            log(`failed to parse ${lang} lexicon: ${err.message}`);

            const context = { window: { gcexports: {} } };
            vm.createContext(context);
            vm.runInContext(data, context);
            if (typeof(context.window.gcexports.globalLexicon) === 'object') {
              lexicon = context.window.gcexports.globalLexicon;
            }
          }
          if (!lexicon) {
            resume(err);
          }
        }
        cache.set(lang, lexicon);
        main.parse(src, lexicon, resume);
      });
    }
  };
};
