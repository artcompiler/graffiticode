Storer
---
The job of a `storer` is to set `data` by `id` and retrieve a public URL by `id`.

## Storers
### `ThrowingStorer`
- `set` throws error
- `get` throws error

### `GcsStorer` ([Google Cloud Storage](https://cloud.google.com/storage))
This storer uses GCS to store and serve the statically built items. The storer needs a [`bucket`](https://cloud.google.com/storage/docs/key-terms#buckets) name (defaults to `graffiticode_static`) and GCS credentials (see [here](https://cloud.google.com/docs/authentication) on how to configure). The bucket can be set using the `GCS_BUCKET_NAME` environment variable.
- `set(id, data)` saves the `data` to an object named `<id>.html` and makes the object public.
- `get(id)` checks the object exists and then returns the public url (ie `https://storage.googleapis.com/${name}/${id}.html`).

### `AwsStorer` ([Simple Storage Service](https://aws.amazon.com/s3))
This storer uses S3 to store and serve the statically built items. The storer needs a bucket name (default is `artcompiler-static`), region (the default is `us-west-1`), and AWS credentials (see [here](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html) on how to configure). The bucket can be set using the `AWS_BUCKET_NAME` environment variable. The region can be set using the `AWS_REGION` environment variable.
- `set(id, data)` saves the `data` to an object named `<id>.html` and makes the object public.
- `get(id)` checks the object exists and then returns the public url (ie `http://${bucket}.s3-website-${region}.amazonaws.com/${id}.html`).
