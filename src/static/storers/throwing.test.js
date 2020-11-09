const { buildThrowingStorer } = require('./throwing');

describe('storer/throwing', () => {
  it('should throw when set is called', async () => {
    // Arrange
    const message = 'for testing';
    const storer = buildThrowingStorer({ message });
    const id = 'id';
    const data = 'data';

    // Act
    await expect(storer.set(id, data)).rejects.toThrow(new Error(message));

    // Assert
  });
  it('should throw when get is called', async () => {
    // Arrange
    const message = 'for testing';
    const storer = buildThrowingStorer({ message });
    const id = 'id';

    // Act
    await expect(storer.get(id)).rejects.toThrow(new Error(message));

    // Assert
  });
});