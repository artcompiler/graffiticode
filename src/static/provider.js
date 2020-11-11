exports.buildProvider = ({ storer, builder }) => {
  return async function provider(id) {
    try {
     return await storer.get(id); 
    } catch (error) {
      // TODO throw error if not found
    }
    const publicUrl = await builder(id);
    await storer.set(id, publicUrl);
    return publicUrl;
  };
};
