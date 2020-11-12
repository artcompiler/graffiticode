const AWS = require('aws-sdk');

exports.buildAwsStorer = ({
  makeNotFoundError,
  region,
  bucket,
  s3,
}) => {
  const set = async (id, data) => {
    const upload = s3.upload({
      Bucket: bucket,
      Key: `${id}.html`,
      Body: data,
      ContentType: 'text/html',
      ContentDisposition: 'inline',
      CacheControl: 'public, max-age=3600',
      ACL: 'public-read',
    });
    await upload.promise();
  };
  const get = async (id) => {
    try {
      const getObject = s3.getObject({
        Bucket: bucket,
        Key: `${id}.html`,
      });
      await getObject.promise();
      return `http://${bucket}.s3-website-${region}.amazonaws.com/${id}.html`;
    } catch(err) {
      if (err.statusCode === 404) {
        err = makeNotFoundError(`${id} is not found`);
      }
      throw err;
    }
  };
  return { set, get };
}