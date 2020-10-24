function buildProvider({ storer, builder }) {
  return async function provider(id) {
    try {
     return await storer.get(id); 
    } catch (error) {
      // TODO throw error if not found
    }
    const data = await builder(id);
    await storer.set(id, data);
    return data;
  };
}
exports.buildProvider = buildProvider;
