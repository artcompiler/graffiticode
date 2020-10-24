function buildMakeInMemoryStorer({ makeNotFoundError }) {
  return function makeInMemoryStorer() {
    const store = new Map();
    const set = async (id, data) => store.set(id, data);
    const get = async (id) => {
      if (!store.has(id)) {
        throw makeNotFoundError(`${id} is not found`);
      }
      return store.get(id);
    };
    return { set, get };
  };
}
exports.buildMakeInMemoryStorer = buildMakeInMemoryStorer;
