exports.buildGcsStorer = ({ makeNotFoundError, storage, name }) => {
  const bucket = storage.bucket(name);
  const set = async (id, data) => {
    const file = bucket.file(`${id}.html`);
    await file.save(data);
    await file.makePublic();
  };
  const get = async (id) => {
    try {
      const file = bucket.file(`${id}.html`);
      const [exists] = await file.exists();
      if (!exists) {
        throw makeNotFoundError(`${id} is not found`);
      }
      const publicUrl = `https://storage.googleapis.com/${name}/${id}.html`;
      return publicUrl;
    } catch(err) {
      if (err.code === 404) {
        throw makeNotFoundError(`${id} is not found`);
      }
      throw err;
    }
  };
  return { set, get };
};
