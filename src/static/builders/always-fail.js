function buildAlwaysFailBuilder({}) {
  return async function alwaysFailBuilder(id) {
    throw new Error(`always fail builder: ${id}`);
  };
}
exports.buildAlwaysFailBuilder = buildAlwaysFailBuilder;
