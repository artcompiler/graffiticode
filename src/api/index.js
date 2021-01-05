const bent = require('bent');

const { buildCompile } = require('./compile');
const { buildGetLangAsset } = require('./lang-asset');
const { buildPingLang } = require('./ping-lang');


const LOCAL_COMPILES = process.env.LOCAL_COMPILES === 'true' || false;
const API_HOST = process.env.API_HOST || 'api.acx.ac';

let apiUrl;
if (LOCAL_COMPILES) {
  apiUrl = 'http://localhost:3100';
} else {
  apiUrl = `https://${API_HOST}`;
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
