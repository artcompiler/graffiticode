const { webpackBuilder } = require('./builders');
const { awsStorer, gcsStorer } = require('./storers');

const STORER_TYPE = process.env.STORER_TYPE || 'aws';

const { buildProvider } = require('./provider');

let storer;
if (STORER_TYPE === 'aws') {
  storer = awsStorer;
} else if (STORER_TYPE === 'gcs') {
  storer = gcsStorer;
} else {
  console.warn(`Unknown storer type: '${STORER_TYPE}'`);
  process.exit(1);
}

exports.provider = buildProvider({
  storer,
  builder: webpackBuilder,
});
