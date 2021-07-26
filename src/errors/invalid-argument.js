function buildMakeInvalidArgumentError({}) {
  return function makeInvalidArgumentError(msg) {
    const err = new Error(msg);
    err.statusCode = 400;
    err.status = 'Invalid Argument';
    return err;
  };
}
exports.buildMakeInvalidArgumentError = buildMakeInvalidArgumentError;
