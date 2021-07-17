const { buildParse } = require('./parse');
const { mockCallbackValue, mockCallbackError } = require('./../testing');

describe('common/parse', () => {
  it('should call main parser language lexicon', async () => {
    // Arrange
    const log = jest.fn();
    const cache = new Map();
    const getLangAsset = mockCallbackValue('{}');
    const main = {
      parse: mockCallbackValue({ root: '0' }),
    };
    const parse = buildParse({ log, cache, getLangAsset, main });
    const lang = 'L0';
    const src = `'foo'..`;

    // Act
    await expect(new Promise((resolve, reject) => {
      parse(lang, src, (err, ast) => {
        if (err) {
          reject(err);
        } else {
          resolve(ast);
        }
      });
    })).resolves.toStrictEqual({ root: '0' });

    // Assert
    expect(getLangAsset).toHaveBeenCalledWith(lang, 'lexicon.js', expect.anything());
    expect(main.parse).toHaveBeenCalledWith(src, {}, expect.anything());
    expect(cache.has(lang)).toBe(true);
    expect(cache.get(lang)).toStrictEqual({});
  });
  it('should call main parser cached lexicon', async () => {
    // Arrange
    const cache = new Map();
    const main = {
      parse: mockCallbackValue({ root: '0' }),
    };
    const parse = buildParse({
      cache,
      main,
    });
    const lang = 'L0';
    const src = `'foo'..`;
    cache.set(lang, {});

    // Act
    await expect(new Promise((resolve, reject) => {
      parse(lang, src, (err, ast) => {
        if (err) {
          reject(err);
        } else {
          resolve(ast);
        }
      });
    })).resolves.toStrictEqual({ root: '0' });

    // Assert
    expect(main.parse).toHaveBeenCalledWith(src, {}, expect.anything());
  });
  it('should return error if get language asset fails', async () => {
    // Arrange
    const cache = new Map();
    const err = new Error('failed to get lexicon');
    const getLangAsset = mockCallbackError(err);
    const parse = buildParse({
      cache,
      getLangAsset,
    });
    const lang = 'L0';
    const src = `'foo'..`;

    // Act
    await expect(new Promise((resolve, reject) => {
      parse(lang, src, (err, ast) => {
        if (err) {
          reject(err);
        } else {
          resolve(ast);
        }
      });
    })).rejects.toBe(err);

    // Assert
    expect(getLangAsset).toHaveBeenCalledWith(lang, 'lexicon.js', expect.anything());
  });
  it('should return error if main parser fails', async () => {
    // Arrange
    const log = jest.fn();
    const cache = new Map();
    const getLangAsset = mockCallbackValue('{}');
    const err = new Error('main parser failed');
    const main = { parse: mockCallbackError(err) };
    const parse = buildParse({ log, cache, getLangAsset, main });
    const lang = 'L0';
    const src = `'foo'..`;

    // Act
    await expect(new Promise((resolve, reject) => {
      parse(lang, src, (err, ast) => {
        if (err) {
          reject(err);
        } else {
          resolve(ast);
        }
      });
    })).rejects.toBe(err);

    // Assert
    expect(getLangAsset).toHaveBeenCalledWith(lang, 'lexicon.js', expect.anything());
    expect(main.parse).toHaveBeenCalledWith(src, {}, expect.anything());
    expect(cache.has(lang)).toBe(true);
    expect(cache.get(lang)).toStrictEqual({});
  });
  it('should return succeed if lexicon is a buffer', async () => {
    // Arrange
    const log = jest.fn();
    const cache = new Map();
    const getLangAsset = mockCallbackValue(Buffer.from('{}'));
    const ast = { root: '0' };
    const main = { parse: mockCallbackValue(ast) };
    const parse = buildParse({ log, cache, getLangAsset, main });
    const lang = 'L0';
    const src = `'foo'..`;

    // Act
    await expect(new Promise((resolve, reject) => {
      parse(lang, src, (err, ast) => {
        if (err) {
          reject(err);
        } else {
          resolve(ast);
        }
      });
    })).resolves.toStrictEqual(ast);

    // Assert
    expect(getLangAsset).toHaveBeenCalledWith(lang, 'lexicon.js', expect.anything());
    expect(main.parse).toHaveBeenCalledWith(src, {}, expect.anything());
    expect(cache.has(lang)).toBe(true);
    expect(cache.get(lang)).toStrictEqual({});
  });
  it('should try vm if lexicon cannot parse JSON', async () => {
    // Arrange
    const log = jest.fn();
    const cache = new Map();
    const rawLexicon = `
    (() => {
      window.gcexports.globalLexicon = {};
    })();
    `;
    const getLangAsset = mockCallbackValue(rawLexicon);
    const ast = { root: '0' };
    const main = { parse: mockCallbackValue(ast) };
    const vm = {
      createContext: jest.fn(),
      runInContext: jest.fn().mockImplementation((data, context) => {
        context.window.gcexports.globalLexicon = {};
      }),
    };
    const parse = buildParse({ log, cache, getLangAsset, main, vm });
    const lang = 'L0';
    const src = `'foo'..`;

    // Act
    await expect(new Promise((resolve, reject) => {
      parse(lang, src, (err, ast) => {
        if (err) {
          reject(err);
        } else {
          resolve(ast);
        }
      });
    })).resolves.toStrictEqual(ast);

    // Assert
    expect(getLangAsset).toHaveBeenCalledWith(lang, 'lexicon.js', expect.anything());
    expect(main.parse).toHaveBeenCalledWith(src, {}, expect.anything());
    expect(cache.has(lang)).toBe(true);
    expect(cache.get(lang)).toStrictEqual({});
    expect(vm.createContext).toHaveBeenCalled();
    expect(vm.runInContext).toHaveBeenCalledWith(rawLexicon, expect.anything());
  });
});
