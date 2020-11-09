exports.buildThrowingStorer = ({ message }) => {
  const set = async (id, data) => {
    throw new Error(message);
  };
  const get = async (id) => {
    throw new Error(message);
  };
  return { set, get };
}