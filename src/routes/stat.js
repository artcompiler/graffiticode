const { Router } = require('express');
const { isNonEmptyString } = require('./../utils');

module.exports = (dbQuery, insertItem) => {
  const router = new Router();
  // Get a stat  
  router.get('/', (req, res) => {
    const { id } = req.query;
    if (!id) {
      return res.sendStatus(400);
    }
    dbQuery(`SELECT mark FROM items WHERE itemID='${id}'`, (err, result) => {
      if (err) {
        return res.sendStatus(500);
      }
      res.status(200).json(result.rows);
    });
  });
  // Update a stat
  router.put('/', (req, res) => {
    let { userID, itemID, mark } = req.body;
    if (!isNonEmptyString(userID)) {
      return res.sendStatus(400);
    }
    if (!isNonEmptyString(itemID)) {
      return res.sendStatus(400);
    }
    if (typeof (mark) !== 'string') {
      return res.sendStatus(400);
    }
    mark = mark === '' ? 'null' : `'${mark}'`;
    insertItem(userID, itemID, (err) => {
      if (err) {
        return res.sendStatus(500);
      }
      const query = `UPDATE items SET mark=${mark} WHERE itemID='${itemID}'`;
      dbQuery(query, (err, result) => {
        if (err) {
          return res.sendStatus(500);
        }
        res.sendStatus(200);
      });
    });
  });
  return router;
};
