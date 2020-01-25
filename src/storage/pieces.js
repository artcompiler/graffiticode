function buildCreatePiece({ dbQuery, createPieceHash, cleanAndTrimSrc, cleanAndTrimObj }) {
  return function createPiece(forkID, parentID, userID, src, obj, lang, label, img, address, ast, resume) {
    createPieceHash(userID, lang, ast, (err, hash) => {
      if (err) {
        resume(err);
      } else {
        src = cleanAndTrimSrc(src);
        obj = cleanAndTrimObj(obj);
        img = cleanAndTrimObj(img);
        ast = cleanAndTrimSrc(JSON.stringify(ast));
        const query = `
        INSERT INTO pieces (created,fork_id,parent_id,user_id,views,forks,src,obj,language,img,address,label,ast,hash)
        VALUES (now(),${forkID},${parentID},${userID},0,0,'${src}','${obj}','${lang}','${img}','${address}','${label}','${ast}','${hash}')
        RETURNING *;
        `;
        dbQuery(query, (err, result) => {
          if (err) {
            resume(err);
          } else if (result.rows.length > 0) {
            resume(null, result.rows[0]);
          } else {
            resume(new Error(`insert returned zero rows: ${query}`));
          }
        });
      }
    });
  };
}

function buildGetPiece({ dbQuery }) {
  return function getPiece(id, resume) {
    const query = `SELECT * FROM pieces WHERE id=${id};`;
    dbQuery(query, (err, result) => {
      if (err) {
        resume(err);
      } else if (result.rows.length <= 0 || result.rows[0].id < 1000 ) {
        resume(new Error('Invalid Id'));
      } else {
        resume(null, result.rows[0]);
      }
    });
  };
}

function buildIncrementForks({ dbQuery }) {
  return function incrementForks(id, resume) {
    const query = `
    UPDATE pieces
    SET forks=forks+1
    WHERE id=${id}
    RETURNING forks;
    `;
    dbQuery(query, (err, result) => {
      if (err) {
        resume(err);
      } else if (result.rows.length > 0) {
        resume(null, result.rows[0].forks);
      } else {
        resume(new Error(`update forks returned zero rows: ${query}`));
      }
    });
  };
}

function buildIncrementViews({ dbQuery }) {
  return function incrementViews(id, resume) {
    const query = `
    UPDATE pieces
    SET views=views+1
    WHERE id=${id}
    RETURNING views;
    `;
    dbQuery(query, (err, result) => {
      if (err) {
        resume(err);
      } else if (result.rows.length > 0) {
        resume(null, result.rows[0].views);
      } else {
        resume(new Error(`update views returned zero rows: ${query}`));
      }
    });
  };
}

function buildItemToID({ dbQuery, createPieceHash }) {
  return function itemToID(userID, lang, ast, resume) {
    createPieceHash(userID, lang, ast, (err, hash) => {
      if (err) {
        console.log(`ERROR itemToID createPieceHash err=${err.message}`);
        resume(null, null);
      } else {
        // FIXME How do we handle collisions? Are they so rare we don't need to
        // worry about them?
        const query = `SELECT id FROM pieces WHERE hash='${hash}' ORDER BY created LIMIT 1`;
        dbQuery(query, (err, result) => {
          if (err) {
            resume(err);
          } else if (result.rows.length > 0) {
            const itemID = result.rows[0].id;
            resume(null, itemID);
          } else {
            resume(null, null);
          }
        });
      }
    });
  };
}

function buildUpdatePiece({ dbQuery, isNonEmptyString, cleanAndTrimSrc, cleanAndTrimObj }) {
  return function updateItem(id, src, obj, img, resume) {
    const updates = [];
    if (isNonEmptyString(src)) {
      updates.push(`src='${cleanAndTrimSrc(src)}'`);
    }
    if (isNonEmptyString(obj)) {
      updates.push(`obj='${cleanAndTrimObj(obj)}'`);
    }
    if (isNonEmptyString(img)) {
      updates.push(`img='${cleanAndTrimObj(img)}'`);
    }
    if (updates.length > 0) {
      const query = `UPDATE pieces SET ${updates.join(',')} WHERE id=${id};`;
      dbQuery(query, (err) => {
        if (err) {
          resume(err);
        } else {
          resume(null);
        }
      });
    } else {
      resume(null);
    }
  };
}

function buildUpdatePieceAST({ dbQuery, createPieceHash, isNonEmptyString, parseJSON, itemToHash, cleanAndTrimSrc }) {
  return function updatePieceAST(id, userID, lang, ast, resume) {
    createPieceHash(userID, lang, ast, (err, hash) => {
      if (err) {
        resume(err);
      } else {
        ast = cleanAndTrimSrc(JSON.stringify(ast));
        const query = `UPDATE pieces SET ast='${ast}', hash='${hash}' WHERE id=${id};`;
        dbQuery(query, (err) => {
          if (err) {
            resume(err);
          } else {
            resume(null);
          }
        });
      }
    });
  };
}

function buildCreatePieceHash({ isNonEmptyString, parseJSON, itemToHash }) {
  return function createPieceHash(userID, lang, ast, resume) {
    if (isNonEmptyString(ast)) {
      ast = parseJSON(ast);
    }
    try {
      const hash = itemToHash(userID, lang, ast);
      resume(null, hash);
    } catch(err) {
      resume(err);
    }
  };
}

function buildPiecesApi({ dbQuery, isNonEmptyString, parseJSON, cleanAndTrimSrc, cleanAndTrimObj, itemToHash }) {
  const createPieceHash = buildCreatePieceHash({ isNonEmptyString, parseJSON, itemToHash });
  const createPiece = buildCreatePiece({ dbQuery, createPieceHash, cleanAndTrimSrc, cleanAndTrimObj });
  const getPiece = buildGetPiece({ dbQuery });
  const incrementForks = buildIncrementForks({ dbQuery });
  const incrementViews = buildIncrementViews({ dbQuery });
  const itemToID = buildItemToID({ dbQuery, createPieceHash });
  const updatePiece = buildUpdatePiece({ dbQuery, isNonEmptyString, cleanAndTrimObj, cleanAndTrimSrc });
  const updatePieceAST = buildUpdatePieceAST({ dbQuery, createPieceHash, isNonEmptyString, parseJSON, itemToHash, cleanAndTrimSrc });
  return {
    createPiece,
    getPiece,
    incrementForks,
    incrementViews,
    itemToID,
    updatePiece,
    updatePieceAST,
  };
};
exports.buildPiecesApi = buildPiecesApi;