function buildReadinessCheck({ dbQuery }) {
  return function readinessCheck(resume) {
    dbQuery("SELECT 1", (err, result) => {
      if (err) {
        resume(err);
      } else {
        resume(null);
      }
    });
  };
}
exports.buildReadinessCheck = buildReadinessCheck;