function buildDbQuery({ assert, isNonEmptyString, pool }) {
  return function dbQuery(query, resume) {
    assert(isNonEmptyString(query), 'query must be a non-empty string');
    assert('function' === typeof resume, 'resume must be a function');
    const start = process.hrtime();
    pool.query(query, (err, result) => {
      const diff = process.hrtime(start);
      const duration = (diff[0] * 1e9 + diff[1]) / 1e6;
      if (duration > 500) {
        console.log(`Query took ${duration.toFixed(3)}ms - ${query}`);
      }
      if (err) {
        console.log(`ERROR dbQuery: ${err.message}\n${query}\n`);
        resume(err);
      } else {
        resume(null, result);
      }
    });
  };
}
exports.buildDbQuery = buildDbQuery;
