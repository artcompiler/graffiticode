const { makeInMemoryStorer } = require('./storers');
const { buildProvider } = require('./provider');

describe('static/provider', () => {
  it('should call builder if not cached', async () => {
    // Arrange
    const data = 'data';
    const storer = makeInMemoryStorer();
    const builder = jest.fn().mockResolvedValue(data);
    const provider = buildProvider({ storer, builder });
    const id = '123';

    // Act
    await expect(provider(id)).resolves.toBe(data);

    // Assert
    expect(builder).toHaveBeenCalledWith(id);
  });
  it('should not call builder if cached', async () => {
    // Arrange
    const data = 'data';
    const storer = makeInMemoryStorer();
    const builder = jest.fn().mockResolvedValue(data);
    const provider = buildProvider({ storer, builder });
    const id = '123';
    await storer.set(id, data);

    // Act
    await expect(provider(id)).resolves.toBe(data);

    // Assert
    expect(builder).not.toHaveBeenCalled();
  });
});