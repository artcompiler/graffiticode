const { makeNotFoundError } = require('./../../errors');

const { buildMakeDoNotStorer } = require('./do-not');
const { buildMakeGcsStorer } = require('./gcs');
const { buildMakeInMemoryStorer } = require('./in-memory');

exports.makeDoNotStorer = buildMakeDoNotStorer({ makeNotFoundError });
exports.makeGcsStorer = buildMakeGcsStorer({ makeNotFoundError });
exports.makeInMemoryStorer = buildMakeInMemoryStorer({ makeNotFoundError });