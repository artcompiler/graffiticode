exports.buildProvider = ({ storer, builder }) => {
  return async function provider(id) {
    try {
      const publicUrl = await storer.get(id);
      return publicUrl;
    } catch (error) {
      // TODO throw error if not found
    }
    const data = await builder(id);
    await storer.set(id, data);
    const publicUrl = await storer.get(id);
    return publicUrl;
  };
};
