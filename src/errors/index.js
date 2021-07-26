const { buildMakeInvalidArgumentError } = require('./invalid-argument');
const { buildMakeNotFoundError } = require('./not-found');

exports.makeInvalidArgumentError = buildMakeInvalidArgumentError({});
exports.makeNotFoundError = buildMakeNotFoundError({});
