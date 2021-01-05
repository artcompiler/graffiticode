exports.buildGetLang = ({ getPiece }) => {
  return function getLang(ids, resume) {
    const langID = ids[0];
    if (langID !== 0) {
      resume(null, `L${langID}`);
    } else {
      getPiece(ids[1], (err, item) => {
        if (err) {
          resume(err);
        } else {
          resume(null, item.language);
        }
      });
    }
  };
};
