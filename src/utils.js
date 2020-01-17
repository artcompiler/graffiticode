const assert = require('assert');
const crypto = require('crypto');

function getCompilerHost(lang, config) {
  if (config.hosts.get(lang)) {
    return config.hosts.get(lang);
  }
  if (config.isLocalCompiler) {
    return 'localhost';
  }
  return `${lang}.artcompiler.com`;
}
exports.getCompilerHost = getCompilerHost;

function getCompilerPort(lang, config) {
  if (config.ports.get(lang)) {
    return config.ports.get(lang);
  }
  if (config.isLocalCompiler) {
    return `5${lang.substring(1)}`;
  }
  return '80';
}
exports.getCompilerPort = getCompilerPort;

function isNonEmptyString(str) {
  return ('string' === typeof(str) && 0 < str.length);
}
exports.isNonEmptyString = isNonEmptyString;

function itemToHash({userId, lang, ast}) {
  userId = Number.parseInt(userId);
  assert(!Number.isNaN(userId), 'userId must be a integer');
  assert(/^L\d+/.test(lang), 'lang must be a string with format L#');
  assert('object' === typeof ast && null !== ast, 'ast must be a non null object');
  const hasher = crypto.createHash('sha256');
  hasher.update(`${userId}.${lang}.${JSON.stringify(ast)}`);
  return hasher.digest('hex');
}
exports.itemToHash = itemToHash;
