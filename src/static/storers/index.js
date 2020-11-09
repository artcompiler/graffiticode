const {Storage} = require('@google-cloud/storage');
const { makeNotFoundError } = require('./../../errors');

const storage = new Storage();
const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'graffiticode_static';

const { buildGcsStorer } = require('./gcs');
const { buildThrowingStorer } = require('./throwing');

exports.gcsStorer = buildGcsStorer({
  makeNotFoundError,
  name: GCS_BUCKET_NAME,
  storage,
});