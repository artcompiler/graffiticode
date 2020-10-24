const { webpackBuilder } = require('./builders');
const { makeInMemoryStorer } = require('./storers');

const { buildProvider } = require('./provider');

exports.provider = buildProvider({
  storer: makeInMemoryStorer(),
  builder: webpackBuilder,
});
