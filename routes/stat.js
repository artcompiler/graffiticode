const { Router } = require('express');
const { isNonEmptyString } = require('./../src/utils');

module.exports = (dbQuery, insertItem) => {
  const router = new Router();
  // Get a stat  
  router.get('/', (req, res) => {
    const { id } = req.query;
    if (!id) {
      res.sendStatus(400);
    }
    dbQuery(`SELECT userID, itemID, mark, label FROM items WHERE itemID='${id}'`, (err, result) => {
      if (err) {
        res.sendStatus(500);
      } else {
        res.status(200).json(result.rows);
      }
    });
  });
  // Update a stat
  router.put('/', (req, res) => {
    let { userID, itemID, mark, label } = req.body;
    if (!isNonEmptyString(userID)) {
      res.sendStatus(400);
      return;
    }
    if (!isNonEmptyString(itemID)) {
      res.sendStatus(400);
      return;
    }
    if (typeof mark !== 'string' &&
        typeof label !== 'string') {
      res.sendStatus(400);
      return;
    }
    let setClause = '';
    setClause += 'SET ';
    setClause += typeof mark === 'string' && mark && `mark='${mark}' ` || `mark=null`;
    setClause += typeof label === 'string' && `label='${label}'` || '';;
    insertItem(userID, itemID, (err) => {
      if (err) {
        res.sendStatus(500);
        return;
      }
      const query = `UPDATE items ${setClause} WHERE itemID='${itemID}'`;
      dbQuery(query, (err, result) => {
        if (err) {
          res.sendStatus(500);
          return;
        }
        res.sendStatus(200);
      });
    });
  });
  return router;
};
