const assert = require('assert');
const pg = require('pg');
const { decodeID, encodeID } = require('./../id');
const {
  cleanAndTrimObj,
  cleanAndTrimSrc,
  isNonEmptyString,
  itemToHash,
  parseJSON,
} = require('./../utils');

const { buildDbQuery } = require('./db-query');
const { buildItemsApi } = require('./items');
const { buildPiecesApi } = require('./pieces');

const DEBUG = process.env.DEBUG === 'true' || false;
const LOCAL_DATABASE = process.env.LOCAL_DATABASE === 'true' || false;

function getConnectionString({ isLocalDatabase, isDebug, databaseUrlLocal, databaseUrlDev, databaseUrl }) {
  if (isLocalDatabase) {
    return databaseUrlLocal;
  }
  if (isDebug) {
    return databaseUrlDev;
  }
  return databaseUrl;
}

const connectionString = getConnectionString({
  isLocalDatabase: LOCAL_DATABASE,
  isDebug: DEBUG,
  databaseUrlLocal: process.env.DATABASE_URL_LOCAL,
  databaseUrlDev: process.env.DATABASE_URL_DEV,
  databaseUrl: process.env.DATABASE_URL,
});
pg.defaults.ssl = (LOCAL_DATABASE ? false : true);

const pool = new pg.Pool({ connectionString });

const dbQuery = buildDbQuery({ assert, isNonEmptyString, pool });
const {
  createItemByItemId,
  getCountByItemId,
  insertItem,
} = buildItemsApi({ dbQuery, decodeID, encodeID });
const {
  createPiece,
  getPiece,
  incrementForks,
  incrementViews,
  itemToID,
  updatePiece,
  updatePieceAST,
} = buildPiecesApi({ dbQuery, isNonEmptyString, parseJSON, cleanAndTrimSrc, cleanAndTrimObj, itemToHash });

exports = module.exports = {
  dbQuery,

  // Item API
  createItemByItemId,
  getCountByItemId,
  insertItem,

  // Piece API
  createPiece,
  getPiece,
  incrementForks,
  incrementViews,
  itemToID,
  updatePiece,
  updatePieceAST,
};
