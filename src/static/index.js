const { webpackBuilder } = require('./builders');
const { makeGcsStorer, makeInMemoryStorer } = require('./storers');

const { buildProvider } = require('./provider');

exports.provider = buildProvider({
  storer: makeGcsStorer({ name: 'graffiticode.appspot.com' }),
  builder: webpackBuilder,
});

exports.inMemoryWebpackProvider = buildProvider({
  storer: makeInMemoryStorer(),
  builder: webpackBuilder,
});
