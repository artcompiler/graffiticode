const { buildGetData } = require('./data');
const { nilID, encodeID, decodeID } = require('./../id');
const { mockCallbackValue } = require('./../testing');

describe('common/data', () => {
  it('should return empty object if data id is zero', async () => {
    // Arrange
    const getData = buildGetData({
      nilID,
      encodeID,
    });
    const auth = 'auth';
    const ids = [0, 123, 0];
    const refresh = false;

    // Act
    await expect(new Promise((resolve, reject) => {
      getData(auth, ids, refresh, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    })).resolves.toStrictEqual({});

    // Assert
  });
  it('should calls compile ids is longer than 3', async () => {
    // Arrange
    const compileID = mockCallbackValue('data');
    const getData = buildGetData({
      nilID,
      encodeID,
      deps: { compileID },
    });
    const auth = 'auth';
    const ids = [0, 123, 0, 124, 0];
    const refresh = false;

    // Act
    await expect(new Promise((resolve, reject) => {
      getData(auth, ids, refresh, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    })).resolves.toBe('data');

    // Assert
    expect(compileID).toHaveBeenCalledWith(auth, encodeID([0, 124, 0]), { refresh }, expect.anything());
  });
  it('should calls compile if data id is not zero', async () => {
    // Arrange
    const compileID = mockCallbackValue('data');
    const getData = buildGetData({
      nilID,
      encodeID,
      deps: { compileID },
    });
    const auth = 'auth';
    const ids = [0, 123, 42];
    const refresh = false;

    // Act
    await expect(new Promise((resolve, reject) => {
      getData(auth, ids, refresh, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    })).resolves.toBe('data');

    // Assert
    expect(compileID).toHaveBeenCalledWith(auth, encodeID([42]), { refresh }, expect.anything());
  });
  it('should calls compile with refresh', async () => {
    // Arrange
    const compileID = mockCallbackValue('data');
    const getData = buildGetData({
      nilID,
      encodeID,
      deps: { compileID },
    });
    const auth = 'auth';
    const ids = [0, 123, 0, 124, 0];
    const refresh = true;

    // Act
    await expect(new Promise((resolve, reject) => {
      getData(auth, ids, refresh, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    })).resolves.toBe('data');

    // Assert
    expect(compileID).toHaveBeenCalledWith(auth, encodeID([0, 124, 0]), { refresh }, expect.anything());
  });
  it('should return empty object if the ids are the nilID', async () => {
    // Arrange
    const getData = buildGetData({
      nilID,
      encodeID,
    });
    const auth = 'auth';
    const ids = decodeID(nilID);
    const refresh = false;

    // Act
    await expect(new Promise((resolve, reject) => {
      getData(auth, ids, refresh, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    })).resolves.toStrictEqual({});

    // Assert
  });
});
