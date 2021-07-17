const { decodeID, encodeID, nilID } = require('./../id');
const { buildCompileID } = require('./compile');
const { mockCallbackValue, mockCallbackError } = require('./../testing');

describe('common/compile', () => {
  it('should compile if not in cache', async () => {
    // Arrange
    const getCache = mockCallbackValue(null);
    const setCache = jest.fn();
    const incrementViews = mockCallbackValue(1);
    const updatePiece = mockCallbackValue();
    const getData = mockCallbackValue({});
    const getCode = mockCallbackValue({ root: '0'});
    const getLang = mockCallbackValue('L0');
    const compile = mockCallbackValue('obj');
    const compileID = buildCompileID({
      nilID,
      decodeID,
      getCache,
      setCache,
      incrementViews,
      updatePiece,
      getData,
      getCode,
      getLang,
      compile,
    });
    const auth = 'auth';
    const id = encodeID([0, 123, 0]);
    const options = {};

    // Act
    await expect(new Promise((resolve, reject) => {
      compileID(auth, id, options, (err, data) => {
        if (err) {
          reject(err);
         } else {
           resolve(data);
         }
      });
    })).resolves.toBe('obj');

    // Assert
    expect(getCache).toHaveBeenCalledWith(id, 'data', expect.anything());
    expect(incrementViews).toHaveBeenCalledWith(123, expect.anything());
    expect(compile).toHaveBeenCalledWith('auth', 'L0', { root: '0' }, {}, options, expect.anything());
    expect(setCache).toHaveBeenCalledWith('L0', id, 'data', 'obj');
    expect(updatePiece).toHaveBeenCalledWith(123, null, 'obj', null, expect.anything());
  });
  it('should not save if dontsave', async () => {
    // Arrange
    const getCache = mockCallbackValue(null);
    const incrementViews = mockCallbackValue(1);
    const getData = mockCallbackValue({});
    const getCode = mockCallbackValue({ root: '0'});
    const getLang = mockCallbackValue('L0');
    const compile = mockCallbackValue('obj');
    const compileID = buildCompileID({
      nilID,
      decodeID,
      getCache,
      incrementViews,
      getData,
      getCode,
      getLang,
      compile,
    });
    const auth = 'auth';
    const id = encodeID([0, 123, 0]);
    const options = { dontSave: true };

    // Act
    await expect(new Promise((resolve, reject) => {
      compileID(auth, id, options, (err, data) => {
        if (err) {
          reject(err);
         } else {
           resolve(data);
         }
      });
    })).resolves.toBe('obj');

    // Assert
    expect(getCache).toHaveBeenCalledWith(id, 'data', expect.anything());
    expect(incrementViews).toHaveBeenCalledWith(123, expect.anything());
    expect(compile).toHaveBeenCalledWith('auth', 'L0', { root: '0' }, {}, options, expect.anything());
  });
  it('should not compile if in cache', async () => {
    // Arrange
    const getCache = mockCallbackValue('obj');
    const compileID = buildCompileID({
      nilID,
      decodeID,
      getCache,
    });
    const auth = 'auth';
    const id = encodeID([0, 123, 0]);
    const options = {};

    // Act
    await expect(new Promise((resolve, reject) => {
      compileID(auth, id, options, (err, data) => {
        if (err) {
          reject(err);
         } else {
           resolve(data);
         }
      });
    })).resolves.toBe('obj');

    // Assert
    expect(getCache).toHaveBeenCalledWith(id, 'data', expect.anything());
  });
  it('should compile if refresh', async () => {
    // Arrange
    const getCache = mockCallbackValue(null);
    const setCache = jest.fn();
    const delCache = jest.fn();
    const incrementViews = mockCallbackValue(1);
    const updatePiece = mockCallbackValue();
    const getData = mockCallbackValue({});
    const getCode = mockCallbackValue({ root: '0'});
    const getLang = mockCallbackValue('L0');
    const compile = mockCallbackValue('obj');
    const compileID = buildCompileID({
      nilID,
      decodeID,
      getCache,
      setCache,
      delCache,
      incrementViews,
      updatePiece,
      getData,
      getCode,
      getLang,
      compile,
    });
    const auth = 'auth';
    const id = encodeID([0, 123, 0]);
    const options = { refresh: true };

    // Act
    await expect(new Promise((resolve, reject) => {
      compileID(auth, id, options, (err, data) => {
        if (err) {
          reject(err);
         } else {
           resolve(data);
         }
      });
    })).resolves.toBe('obj');

    // Assert
    expect(delCache).toHaveBeenCalledWith(id, 'data');
    expect(getCache).toHaveBeenCalledWith(id, 'data', expect.anything());
    expect(incrementViews).toHaveBeenCalledWith(123, expect.anything());
    expect(compile).toHaveBeenCalledWith('auth', 'L0', { root: '0' }, {}, options, expect.anything());
    expect(setCache).toHaveBeenCalledWith('L0', id, 'data', 'obj');
    expect(updatePiece).toHaveBeenCalledWith(123, null, 'obj', null, expect.anything());
  });
  it('should get piece if L113', async () => {
    // Arrange
    const getCache = mockCallbackValue(null);
    const setCache = jest.fn();
    const incrementViews = mockCallbackValue(1);
    const getPiece = mockCallbackValue({ obj: '"obj"'});
    const getData = mockCallbackValue({});
    const getCode = mockCallbackValue({ root: '0'});
    const getLang = mockCallbackValue('L113');
    const compileID = buildCompileID({
      nilID,
      decodeID,
      getCache,
      setCache,
      incrementViews,
      getPiece,
      getData,
      getCode,
      getLang,
    });
    const auth = 'auth';
    const id = encodeID([113, 123, 0]);
    const options = {};

    // Act
    await expect(new Promise((resolve, reject) => {
      compileID(auth, id, options, (err, data) => {
        if (err) {
          reject(err);
         } else {
           resolve(data);
         }
      });
    })).resolves.toBe('obj');

    // Assert
    expect(getCache).toHaveBeenCalledWith(id, 'data', expect.anything());
    expect(incrementViews).toHaveBeenCalledWith(123, expect.anything());
    expect(getPiece).toHaveBeenCalledWith(123, expect.anything());
    expect(setCache).toHaveBeenCalledWith('L113', id, 'data', 'obj');
  });
  it('should get piece if L113 compile if unable to parse', async () => {
    // Arrange
    const log = jest.fn();
    const getCache = mockCallbackValue(null);
    const setCache = jest.fn();
    const incrementViews = mockCallbackValue(1);
    const getPiece = mockCallbackValue({ obj: 'bad json'});
    const getData = mockCallbackValue({});
    const getCode = mockCallbackValue({ root: '0'});
    const getLang = mockCallbackValue('L113');
    const compile = mockCallbackValue('obj');
    const compileID = buildCompileID({
      log,
      nilID,
      decodeID,
      getCache,
      setCache,
      incrementViews,
      getPiece,
      getData,
      getCode,
      getLang,
      compile,
    });
    const auth = 'auth';
    const id = encodeID([113, 123, 0]);
    const options = {};

    // Act
    await expect(new Promise((resolve, reject) => {
      compileID(auth, id, options, (err, data) => {
        if (err) {
          reject(err);
         } else {
           resolve(data);
         }
      });
    })).resolves.toBe('obj');

    // Assert
    expect(getCache).toHaveBeenCalledWith(id, 'data', expect.anything());
    expect(incrementViews).toHaveBeenCalledWith(123, expect.anything());
    expect(getPiece).toHaveBeenCalledWith(123, expect.anything());
    expect(compile).toHaveBeenCalledWith('auth', 'L113', { root: '0' }, {}, options, expect.anything());
    expect(setCache).toHaveBeenCalledWith('L113', id, 'data', 'obj');
  });
});
