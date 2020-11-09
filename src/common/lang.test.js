const { buildGetLang } = require('./lang');
const { mockCallbackValue, mockCallbackError } = require('./../testing');

describe('common/lang', () => {
  it('should return language string if langID is not zero', async () => {
    // Arrange
    const getLang = buildGetLang({});
    const ids = [1, 123, 0];

    // Act
    await expect(new Promise((resolve, reject) => {
      getLang(ids, (err, lang) => {
        if (err) {
          reject(err);
        } else {
          resolve(lang);
        }
      });
    })).resolves.toBe('L1');

    // Assert
  });
  it('should return piece language if langID is zero', async () => {
    // Arrange
    const getPiece = mockCallbackValue({ language: 'L0' });
    const getLang = buildGetLang({ getPiece });
    const ids = [0, 123, 0];

    // Act
    await expect(new Promise((resolve, reject) => {
      getLang(ids, (err, lang) => {
        if (err) {
          reject(err);
        } else {
          resolve(lang);
        }
      });
    })).resolves.toBe('L0');

    // Assert
    expect(getPiece).toHaveBeenCalledWith(123, expect.anything());
  });
  it('should return getPiece error when it fails', async () => {
    // Arrange
    const err = new Error('failed to get piece');
    const getPiece = mockCallbackError(err);
    const getLang = buildGetLang({ getPiece });
    const ids = [0, 123, 0];

    // Act
    await expect(new Promise((resolve, reject) => {
      getLang(ids, (err, lang) => {
        if (err) {
          reject(err);
        } else {
          resolve(lang);
        }
      });
    })).rejects.toBe(err);

    // Assert
    expect(getPiece).toHaveBeenCalledWith(123, expect.anything());
  });
});