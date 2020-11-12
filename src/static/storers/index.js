const AWS = require('aws-sdk');
const {Storage} = require('@google-cloud/storage');
const { makeNotFoundError } = require('./../../errors');

const s3 = new AWS.S3();
const storage = new Storage();

const AWS_REGION = process.env.AWS_REGION || 'us-west-1';
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME || 'artcompiler-static';
const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'graffiticode_static';

const { buildAwsStorer } = require('./aws');
const { buildGcsStorer } = require('./gcs');
const { buildThrowingStorer } = require('./throwing');

exports.awsStorer = buildAwsStorer({
  makeNotFoundError,
  region: AWS_REGION,
  bucket: AWS_BUCKET_NAME,
  s3,
});
exports.gcsStorer = buildGcsStorer({
  makeNotFoundError,
  name: GCS_BUCKET_NAME,
  storage,
});
