const {
  getCompilerHost,
  getCompilerPort,
  isNonEmptyString
} = require('../utils.js');

describe('utils', () => {
  describe('getCompilerHost', () => {
    it('should return localhost if isLocalCompiler is true', () => {
      const config = { isLocalCompiler: true, hosts: new Map() };
      expect(getCompilerHost('L0', config)).to.equal('localhost');
    });
    it('should return default if isLocalCompiler is false', () => {
      const config = { isLocalCompiler: false, hosts: new Map() };
      expect(getCompilerHost('L0', config)).to.equal('L0.artcompiler.com');
    });
    it('should return override if hosts is set', () => {
      const config = { isLocalCompiler: false, hosts: new Map([['L0', 'mycompiler.com']]) };
      expect(getCompilerHost('L0', config)).to.equal('mycompiler.com');
    });
  });
  describe('getCompilerPort', () => {
    it('should return localhost if isLocalCompiler is true', () => {
      const config = { isLocalCompiler: true, ports: new Map() };
      expect(getCompilerPort('L0', config)).to.equal('50');
    });
    it('should return default if isLocalCompiler is false', () => {
      const config = { isLocalCompiler: false, ports: new Map() };
      expect(getCompilerPort('L0', config)).to.equal('80');
    });
    it('should return override if ports is set', () => {
      const config = { isLocalCompiler: false, ports: new Map([['L0', '42']]) };
      expect(getCompilerPort('L0', config)).to.equal('42');
    });
  });
  describe('isNonEmptyString', () => {
    it('should return true for string', () => {
      expect(isNonEmptyString('foo')).to.be.true;
    });
    it('should return false for empty string', () => {
      expect(isNonEmptyString('')).to.be.false;
    });
    it('should return false for number', () => {
      expect(isNonEmptyString(42)).to.be.false;
    });
    it('should return false for boolean', () => {
      expect(isNonEmptyString(false)).to.be.false;
    });
  });
});
