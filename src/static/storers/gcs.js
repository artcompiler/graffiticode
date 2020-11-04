const {Storage} = require('@google-cloud/storage');

const storage = new Storage();

function buildMakeGcsStorer({ makeNotFoundError }) {
  return function makeGcsStorer({ name }) {
    const bucket = storage.bucket(name);
    const set = async (id, data) => {
      const file = bucket.file(`${id}.html`);
      await file.save(data);
    };
    const get = async (id) => {
      const file = bucket.file(`${id}.html`);
      try {
        const [contents] = await file.download();
        return contents;
      } catch(err) {
        if (err.code === 404) {
          throw makeNotFoundError(`${id} is not found`);
        }
        throw err;
      }
    };
    return { set, get };
  };
}
exports.buildMakeGcsStorer = buildMakeGcsStorer;
