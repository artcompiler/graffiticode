const { makeNotFoundError } = require('./../../errors');

const { buildMakeDoNotStorer } = require('./do-not');
const { buildMakeInMemoryStorer } = require('./in-memory');

exports.makeDoNotStorer = buildMakeDoNotStorer({ makeNotFoundError });
exports.makeInMemoryStorer = buildMakeInMemoryStorer({ makeNotFoundError });