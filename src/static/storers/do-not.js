function buildMakeDoNotStorer() {
  const set = async () => {};
  const get = async (id) => {
    throw makeNowFoundError(`${id} is not found`);
  };
  return { set, get };
}
exports.buildMakeDoNotStorer = buildMakeDoNotStorer;
