const { compile, getLangAsset } = require('./../api');
const {
  delCache,
  getCache,
  setCache,
} = require('./../cache');
const { nilID, decodeID, encodeID } = require('./../id');
const main = require('./../main');
const {
  incrementViews,
  getPiece,
  updatePiece,
  updatePieceAST,
} = require('./../storage');

const { buildGetCode } = require('./code');
const { buildCompileID } = require('./compile');
const { buildGetData } = require('./data');
const { buildGetLang } = require('./lang');
const { buildParse } = require('./parse');

const parse = buildParse({
  log: console.log,
  cache: new Map(),
  getLangAsset,
  main,
});
const getDataDeps = {};
const getData = buildGetData({
  nilID,
  encodeID,
  deps: getDataDeps,
});
const getCode = buildGetCode({
  log: console.log,
  getPiece,
  parse,
  updatePieceAST,
});
const getLang = buildGetLang({ getPiece });
const compileID = buildCompileID({
  log: console.log,
  nilID,
  decodeID,
  getCache,
  setCache,
  delCache,
  incrementViews,
  getPiece,
  updatePiece,
  getData,
  getCode,
  getLang,
  compile,
});
getDataDeps.compileID = compileID;

exports.compileID = compileID;
exports.getCode = getCode;
exports.getData = getData;
exports.getLang = getLang;
exports.parse = parse;
