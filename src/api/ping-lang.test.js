const { buildPingLang } = require('./ping-lang');

describe('api/pingLang', () => {
  it('should return true if can reach lang', async () => {
    // Arrange
    const cache = new Map();
    const getBuffer = jest.fn().mockResolvedValue('OK');
    const pingLang = buildPingLang({ cache, getBuffer });
    const lang = 'L0';
    
    // Act
    await expect(new Promise(resolve => pingLang(lang, resolve))).resolves.toBe(true);

    // Assert
    expect(getBuffer).toHaveBeenCalledWith(`/lang?id=0`);
    expect(cache.has(lang)).toBe(true);
    expect(cache.get(lang)).toBe(true);
  });
  it('should return false if the language cannot be reached', async () => {
    // Arrange
    const cache = new Map();
    const getBuffer = jest.fn().mockRejectedValue({ message: 'Invalid Argument', statusCode: 400 });
    const pingLang = buildPingLang({ cache, getBuffer });
    const lang = 'L0';
    
    // Act
    await expect(new Promise(resolve => pingLang(lang, resolve))).resolves.toBe(false);

    // Assert
    expect(getBuffer).toHaveBeenCalledWith(`/lang?id=0`);
    expect(cache.has(lang)).toBe(true);
    expect(cache.get(lang)).toBe(false);
  });
  it('should return true if pong is cached', async () => {
    // Arrange
    const cache = new Map();
    const pingLang = buildPingLang({ cache });
    const lang = 'L0';
    cache.set(lang, true);
    
    // Act
    await expect(new Promise(resolve => pingLang(lang, resolve))).resolves.toBe(true);

    // Assert
  });
  it('should call language if cached pong is false', async () => {
    // Arrange
    const cache = new Map();
    const getBuffer = jest.fn().mockResolvedValue('OK');
    const pingLang = buildPingLang({ cache, getBuffer });
    const lang = 'L0';
    cache.set(lang, false);
    
    // Act
    await expect(new Promise(resolve => pingLang(lang, resolve))).resolves.toBe(true);

    // Assert
    expect(getBuffer).toHaveBeenCalledWith(`/lang?id=0`);
    expect(cache.has(lang)).toBe(true);
    expect(cache.get(lang)).toBe(true);
  });
});
