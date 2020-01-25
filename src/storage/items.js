function buildGetCountByItemId({ dbQuery }) {
  return function getCountByItemId(itemID, resume) {
    const query = `SELECT count(*) as count FROM items WHERE itemID='${itemID}';`;
    dbQuery(query, (err, result) => {
      if (err) {
        resume(err);
      } else if (result.rows.length > 0 ) {
        resume(null, result.rows[0].count);
      } else {
        resume(null, 0);
      }
    });
  };
}

function buildCreateItemByItemId({ dbQuery, decodeID, encodeID }) {
  return function createItemByItemId(userID, itemID, resume) {
    const [langID, codeID, ...dataIDs] = decodeID(itemID);
    const dataID = encodeID(dataIDs);
    const query = `
    INSERT INTO items (userID, itemID, langID, codeID, dataID)
    VALUES (${userID},'${itemID}',${langID},${codeID},'${dataID}')
    RETURNING *;
    `;
    dbQuery(query, (err, result) => {
      if (err) {
        resume(err);
      } else if (result.rows.length > 0 ) {
        resume(null, result.rows[0]);
      } else {
        resume(null, null);
      }
    });
  };
}

function buildInsertItem({ getCountByItemId, createItemByItemId }) {
  return function insertItem(userID, itemID, resume) {
    getCountByItemId(itemID, (err, count) => {
      if (err) {
        resume(err);
      } else if (count > 0) {
        resume(null);
      } else {
        createItemByItemId(userID, itemID, resume);
      }
    });
  };
}

function buildGetLastItemByLang({ dbQuery }) {
  return function getLastItemByLang(langID, resume) {
    const query = `
    SELECT *
    FROM items
    WHERE langid='${langID}'
    ORDER BY id DESC
    LIMIT 1;
    `;
    dbQuery(query, (err, result) => {
      if (err) {
        resume(err);
      } else if (result.rows.length > 0) {
        resume(null, result.rows[0]);
      } else {
        resume(null, null);
      }
    });
  };
}

function buildItemsApi({ dbQuery, decodeID, encodeID }) {
  const createItemByItemId = buildCreateItemByItemId({ dbQuery, decodeID, encodeID });
  const getCountByItemId = buildGetCountByItemId({ dbQuery });
  const insertItem = buildInsertItem({ getCountByItemId, createItemByItemId });
  const getLastItemByLang = buildGetLastItemByLang({ dbQuery });
  return {
    createItemByItemId,
    getCountByItemId,
    getLastItemByLang,
    insertItem,
  };
};
exports.buildItemsApi = buildItemsApi;