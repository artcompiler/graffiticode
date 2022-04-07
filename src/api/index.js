const { URL } = require('url');

const bent = require('bent');

const { buildCompile } = require('./compile');
const { buildGetLangAsset } = require('./lang-asset');
const { buildPingLang } = require('./ping-lang');

const LOCAL_COMPILES = process.env.LOCAL_COMPILES === 'true' || false;
const API_HOST = process.env.API_HOST || 'https://api.graffiticode.com';
console.log(`API_HOST=${API_HOST}`);

let apiUrl;
if (LOCAL_COMPILES) {
  apiUrl = 'http://localhost:3100';
} else {
  apiUrl = API_HOST;
  try {
    new URL(apiUrl);
  } catch (err) {
    if (err.code !== 'ERR_INVALID_URL') {
      throw err;
    }
    apiUrl = `https://${apiUrl}`;
  }
}
console.log(`API host: ${apiUrl}`);

const getBuffer = bent(apiUrl, 'buffer');
const postJSON = bent(apiUrl, 'POST', 'json');

const pingLang = buildPingLang({ cache: new Map(), getBuffer });
const compile = buildCompile({ pingLang, postJSON });
const getLangAsset = buildGetLangAsset({ getBuffer });

exports.compile = compile;
exports.getLangAsset = getLangAsset;
exports.pingLang = pingLang;
