const { buildProvider } = require('./provider');

describe('static/provider', () => {
  it('should call builder if not cached', async () => {
    // Arrange
    const data = 'data';
    const url = 'url';
    const storer = {
      set: jest.fn().mockResolvedValue(),
      get: jest.fn()
        .mockRejectedValueOnce('not found')
        .mockResolvedValue(url),
    };
    const builder = jest.fn().mockResolvedValue(data);
    const provider = buildProvider({ storer, builder });
    const id = '123';

    // Act
    await expect(provider(id)).resolves.toBe(url);

    // Assert
    expect(storer.get).toHaveBeenCalledTimes(2);
    expect(storer.get).toHaveBeenNthCalledWith(1, id);
    expect(builder).toHaveBeenCalledWith(id);
    expect(storer.set).toHaveBeenCalledWith(id, data);
    expect(storer.get).toHaveBeenNthCalledWith(2, id);
  });
  it('should not call builder if cached', async () => {
    // Arrange
    const data = 'data';
    const storer = {
      get: jest.fn().mockResolvedValue(data),
    };
    const provider = buildProvider({ storer });
    const id = '123';

    // Act
    await expect(provider(id)).resolves.toBe(data);

    // Assert
    expect(storer.get).toHaveBeenCalledWith(id);
  });
});
