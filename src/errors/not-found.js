function buildMakeNotFoundError({}) {
  return function makeNotFoundError(msg) {
    const err = new Error(msg);
    err.statusCode = 404;
    err.status = 'Not Found';
    return err;
  };
}
exports.buildMakeNotFoundError = buildMakeNotFoundError;
