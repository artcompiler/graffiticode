Storer
---
The job of a `storer` is to set `data` by `id` and retrieve a public URL by `id`.

## Storers
### `ThrowingStorer`
- `set` throws error
- `get` throws error
### `GcsStorer` ([Google Cloud Storage](https://cloud.google.com/storage))
This storer uses GCS to store and serve the statically built items. The storer needs a [`bucket`](https://cloud.google.com/storage/docs/key-terms#buckets) name (defaults to `graffiticode_static`) and GCS credentials (see [here](https://cloud.google.com/docs/authentication) on how to configure).
- `set(id, data)` saves the `data` to an object named `<id>.html` and makes the object public
- `get(id)` checks the object exists and then returns the public url
