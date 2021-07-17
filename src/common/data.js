exports.buildGetData = ({ nilID, encodeID, deps }) => {
  return function getData(auth, ids, refresh, resume) {
    if (encodeID(ids) === nilID || ids.length === 3 && +ids[2] === 0) {
      resume(null, {});
    } else {
      const id = encodeID(ids.slice(2));
      deps.compileID(auth, id, {refresh: refresh}, resume);
    }
  };
};
