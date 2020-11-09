const { webpackBuilder } = require('./builders');
const { gcsStorer } = require('./storers');

const { buildProvider } = require('./provider');

exports.provider = buildProvider({
  storer: gcsStorer,
  builder: webpackBuilder,
});
