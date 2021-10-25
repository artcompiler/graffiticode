const { buildGetCode } = require('./code');
const { mockCallbackValue, mockCallbackError } = require('./../testing');

describe('common/code', () => {
  it('should calls parse when no item ast', async () => {
    // Arrange
    const log = jest.fn();
    const getPiece = mockCallbackValue({
      user_id: '1',
      language: 'L0',
      src: `'foo'..`,
    });
    const parse = mockCallbackValue('foo');
    const updatePieceAST = mockCallbackValue();
    const getCode = buildGetCode({
      log,
      getPiece,
      parse,
      updatePieceAST,
    });
    const ids = [0, 123, 0];
    const refresh = false;

    // Act
    await expect(new Promise((resolve, reject) => {
      getCode(ids, refresh, (err, code) => {
        if (err) {
          reject(err);
        } else {
          resolve(code);
        }
      });
    })).resolves.toBe('foo');

    // Assert
    expect(getPiece).toHaveBeenCalledWith(123, expect.anything());
    expect(parse).toHaveBeenCalledWith('L0', `'foo'..`, expect.anything());
    expect(updatePieceAST).toHaveBeenCalledWith(123, '1', 'L0', 'foo', expect.anything());
  });
  it('should return ast if present on item and parsable', async () => {
    // Arrange
    const getPiece = mockCallbackValue({
      ast: '"foo"',
    });
    const getCode = buildGetCode({
      getPiece,
    });
    const ids = [0, 123, 0];
    const refresh = false;

    // Act
    await expect(new Promise((resolve, reject) => {
      getCode(ids, refresh, (err, code) => {
        if (err) {
          reject(err);
        } else {
          resolve(code);
        }
      });
    })).resolves.toBe('foo');

    // Assert
    expect(getPiece).toHaveBeenCalledWith(123, expect.anything());
  });
  it('should return ast if present on item', async () => {
    // Arrange
    const getPiece = mockCallbackValue({
      ast: { root: 0 },
    });
    const getCode = buildGetCode({
      getPiece,
    });
    const ids = [0, 123, 0];
    const refresh = false;

    // Act
    await expect(new Promise((resolve, reject) => {
      getCode(ids, refresh, (err, code) => {
        if (err) {
          reject(err);
        } else {
          resolve(code);
        }
      });
    })).resolves.toStrictEqual({ root: 0 });

    // Assert
    expect(getPiece).toHaveBeenCalledWith(123, expect.anything());
  });
  it('should call parse if refresh is true', async () => {
    // Arrange
    const log = jest.fn();
    const getPiece = mockCallbackValue({
      ast: { root: 0 },
      user_id: '1',
      language: 'L0',
      src: `'foo'..`,
    });
    const parse = mockCallbackValue('foo');
    const updatePieceAST = mockCallbackValue();
    const getCode = buildGetCode({
      log,
      getPiece,
      parse,
      updatePieceAST,
    });
    const ids = [0, 123, 0];
    const refresh = true;

    // Act
    await expect(new Promise((resolve, reject) => {
      getCode(ids, refresh, (err, code) => {
        if (err) {
          reject(err);
        } else {
          resolve(code);
        }
      });
    })).resolves.toBe('foo');

    // Assert
    expect(getPiece).toHaveBeenCalledWith(123, expect.anything());
    expect(parse).toHaveBeenCalledWith('L0', `'foo'..`, expect.anything());
    expect(updatePieceAST).toHaveBeenCalledWith(123, '1', 'L0', 'foo', expect.anything());
  });
  it('should return error if parse fails', async () => {
    // Arrange
    const log = jest.fn();
    const getPiece = mockCallbackValue({
      ast: { root: 0 },
      user_id: '1',
      language: 'L0',
      src: `'foo'..`,
    });
    const parse = mockCallbackError([new Error('failed to parse')]);
    const getCode = buildGetCode({
      log,
      getPiece,
      parse,
    });
    const ids = [0, 123, 0];
    const refresh = true;

    // Act
    await expect(new Promise((resolve, reject) => {
      getCode(ids, refresh, (err, code) => {
        if (err) {
          reject(err);
        } else {
          resolve(code);
        }
      });
    })).rejects.toStrictEqual([{ error: 'Syntax error', statusCode: 400 }]);

    // Assert
    expect(getPiece).toHaveBeenCalledWith(123, expect.anything());
    expect(parse).toHaveBeenCalledWith('L0', `'foo'..`, expect.anything());
  });
});
