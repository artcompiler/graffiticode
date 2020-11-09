const { buildGetLangAsset } = require('./lang-asset');

describe('api/lang-asset', () => {
  it('should call get function', async () => {
    // Arrange
    const getBuffer = jest.fn().mockResolvedValue('data');
    const getLangAsset = buildGetLangAsset({ getBuffer });
    const lang = 'L0';
    const path = 'style.css';

    // Act
    await expect(new Promise((resolve, reject) => {
      getLangAsset(lang, path, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    })).resolves.toBe('data');

    // Assert
    expect(getBuffer).toHaveBeenCalledWith('/L0/style.css');
  });
  it('should return error from get function', async () => {
    // Arrange
    const err = 'failed to get lang asset';
    const getBuffer = jest.fn().mockRejectedValue(err);
    const getLangAsset = buildGetLangAsset({ getBuffer });
    const lang = 'L0';
    const path = 'style.css';

    // Act
    await expect(new Promise((resolve, reject) => {
      getLangAsset(lang, path, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    })).rejects.toBe(err);

    // Assert
    expect(getBuffer).toHaveBeenCalledWith('/L0/style.css');
  });
});