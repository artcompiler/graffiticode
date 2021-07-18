exports.buildGetCode = ({
  log,
  getPiece,
  parse,
  updatePieceAST,
}) => {
  return function getCode(ids, refresh, resume) {
    getPiece(ids[1], (err, item) => {
      if (err && err.length) {
        resume(err);
        return;
      }
      if (!refresh && item && item.ast) {
        // if L113 there is no AST.
        const ast = typeof item.ast === "string" && JSON.parse(item.ast) || item.ast;
        resume(null, ast);
        return;
      }
      const user = item.user_id;
      const lang = item.language;
      const src = item.src; //.replace(/\\\\/g, "\\");
      log(`Reparsing SRC: langID=${ids[0]} codeID=${ids[1]} src="${src}"`);
      parse(lang, src, (err, ast) => {
        if (ast) {
          // Don't wait for update.
          updatePieceAST(ids[1], user, lang, ast, (err) => {
            if (err && err.length) {
              log(`ERROR getCode updatePieceAST err=${err.message}`);
            }
          });
        }
        if (err && err.length || err instanceof Error) {
          resume([{ statusCode: 400, error: 'Syntax error' }]);
          return;
        }
        resume(null, ast);
      });
    });
  };
};
