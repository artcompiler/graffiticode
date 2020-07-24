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
const { buildReadinessCheck } = require('./readiness');

const connectionString = process.env.DATABASE_URL;

const pool = new pg.Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

const dbQuery = buildDbQuery({ assert, isNonEmptyString, pool });
const {
  createItemByItemId,
  getCountByItemId,
  getLastItemByLang,
  getLastItemByLabel,
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
const readinessCheck = buildReadinessCheck({ dbQuery });

exports = module.exports = {
  // Database
  dbQuery,
  readinessCheck,

  // Item API
  createItemByItemId,
  getCountByItemId,
  getLastItemByLang,
  getLastItemByLabel,
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
