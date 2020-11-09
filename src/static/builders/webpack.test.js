const { buildWebpackBuilder } = require('./webpack');

describe('webpackBuilder', () => {
  it.skip('should compile', async () => {
    const builder = buildWebpackBuilder({});
    const id = 'VZi8z3zJIJ';

    // Act
    const data = await builder(id);
    
    // Assert
    console.log(data);
  });
});