const { compileID } = require('./../../common');
const { decodeID } = require('./../../id');
const { getPiece } = require('./../../storage');

const { buildAlwaysFailBuilder } = require('./always-fail');
const { buildWebpackBuilder } = require('./webpack');

exports.alwaysFailBuilder = buildAlwaysFailBuilder({});
exports.webpackBuilder = buildWebpackBuilder({
  decodeID,
  getPiece,
  compileID,
});
