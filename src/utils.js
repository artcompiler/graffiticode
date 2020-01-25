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
  return typeof str === 'string' && str.length > 0;
}
exports.isNonEmptyString = isNonEmptyString;

function itemToHash(userID, lang, ast) {
  userID = Number.parseInt(userID);
  assert(!Number.isNaN(userID), 'userId must be a integer');
  assert(/^L\d+/.test(lang), 'lang must be a string with format L#');
  assert('object' === typeof ast && null !== ast, 'ast must be a non null object');
  const hasher = crypto.createHash('sha256');
  hasher.update(`${userID}.${lang}.${JSON.stringify(ast)}`);
  return hasher.digest('hex');
}
exports.itemToHash = itemToHash;



function cleanAndTrimObj(str) {
  if (!isNonEmptyString(str)) {
    return str;
  }
  str = str.replace(new RegExp(`'`,`g`), `''`);
  str = str.replace(new RegExp(`\n`,`g`), ` `);
  return str.trim();
}
exports.cleanAndTrimObj = cleanAndTrimObj;

function cleanAndTrimSrc(str) {
  if (!isNonEmptyString(str)) {
    return str;
  }
  str = str.replace(new RegExp(`'`,`g`), `''`);
  return str.trim();
}
exports.cleanAndTrimSrc = cleanAndTrimSrc;

function parseJSON(str) {
  if (!isNonEmptyString(str)) {
    return null;
  }
  try {
    return JSON.parse(str);
  } catch (err) {
    console.log(err.stack);
    console.log(`ERROR parseJSON: '${str}'`);
    return null;
  }
}
exports.parseJSON = parseJSON;
