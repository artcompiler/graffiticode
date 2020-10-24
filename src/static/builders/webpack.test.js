const fs = require('fs');
const path = require('path');     
const { link } = require('linkfs');
const { createFsFromVolume, Volume } = require('memfs');
const { ufs } = require('unionfs');
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