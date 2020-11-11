const AWS = require('aws-sdk');
const {Storage} = require('@google-cloud/storage');
const { makeNotFoundError } = require('./../../errors');

const s3 = new AWS.S3();
const storage = new Storage();

const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME || 'arn:aws:s3:::acx.ac';
const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'graffiticode_static';

const { buildAwsStorer } = require('./aws');
const { buildGcsStorer } = require('./gcs');
const { buildThrowingStorer } = require('./throwing');

exports.awsStorer = buildAwsStorer({
  makeNotFoundError,
  bucket: AWS_BUCKET_NAME,
  s3,
});
exports.gcsStorer = buildGcsStorer({
  makeNotFoundError,
  name: GCS_BUCKET_NAME,
  storage,
});
