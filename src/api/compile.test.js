const { buildCompile } = require('./compile');
const { mockCallbackError } = require('./../testing');

describe('api/compile', () => {
  it('should call compile', async () => {
    // Arrange
    const pingLang = mockCallbackError(true);
    const postJSON = jest.fn().mockResolvedValue('obj');
    const compile = buildCompile({
      pingLang,
      postJSON,
    });
    const auth = 'auth';
    const lang = 'L0';
    const code = { root: '0' };
    const data = {};
    const options = {};

    // Act
    await expect(new Promise((resolve, reject) => {
      compile(auth, lang, code, data, options, (err, obj) => {
        if (err) {
          reject(err);
        } else {
          resolve(obj);
        }
      });
    })).resolves.toBe('obj');

    // Assert
    expect(pingLang).toHaveBeenCalledWith(lang, expect.anything());
    expect(postJSON).toHaveBeenCalledWith('/compile', {
      auth,
      config: {},
      item: {
        lang: '0',
        code,
        data,
        options,
      },
    });
  });
  it('should return 404 if ping fails', async () => {
    // Arrange
    const pingLang = mockCallbackError(false);
    const compile = buildCompile({
      pingLang,
    });
    const auth = 'auth';
    const lang = 'L0';
    const code = { root: '0' };
    const data = {};
    const options = {};

    // Act
    await expect(new Promise((resolve, reject) => {
      compile(auth, lang, code, data, options, (err, obj) => {
        if (err) {
          reject(err);
        } else {
          resolve(obj);
        }
      });
    })).rejects.toStrictEqual([{ error: `language ${lang} unreachable`, statusCode: 404 }]);

    // Assert
    expect(pingLang).toHaveBeenCalledWith(lang, expect.anything());
  });
  it('should return error from postJSON', async () => {
    // Arrange
    const pingLang = mockCallbackError(true);
    const postJSON = jest.fn().mockRejectedValue({ message: 'invalid argument', statusCode: 400 });
    const compile = buildCompile({
      pingLang,
      postJSON,
    });
    const auth = 'auth';
    const lang = 'L0';
    const code = { root: '0' };
    const data = {};
    const options = {};

    // Act
    await expect(new Promise((resolve, reject) => {
      compile(auth, lang, code, data, options, (err, obj) => {
        if (err) {
          reject(err);
        } else {
          resolve(obj);
        }
      });
    })).rejects.toStrictEqual([{ error: `invalid argument`, statusCode: 400 }]);

    // Assert
    expect(pingLang).toHaveBeenCalledWith(lang, expect.anything());
    expect(postJSON).toHaveBeenCalledWith('/compile', {
      auth,
      config: {},
      item: {
        lang: '0',
        code,
        data,
        options,
      },
    });
  });
});
