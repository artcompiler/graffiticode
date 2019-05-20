const { Router } = require('express');
const { decodeID } = require('./../id');

module.exports = (dbQuery) => {
  const router = new Router();
  // Get a label  
  router.get('/', (req, res) => {
    const ids = decodeID(req.query.id);
    const codeID = ids[1];
    dbQuery(`SELECT label FROM pieces WHERE id = '${codeID}'`, (err, result) => {
      if (err) {
        return res.sendStatus(500);
      }
      if (!result || result.rows.length <= 0) {
        return res.sendStatus(404);
      }
      res.status(200).send(result.rows[0].label);
    });
  });
  // Update a label
  router.put('/', (req, res) => {
    const ids = decodeID(req.body.id);
    const codeID = ids[1];
    const label = req.body.label;
    dbQuery(`UPDATE pieces SET label = '${label}' WHERE id = '${codeID}'`, (err, result) => {
      if (err) {
        return res.sendStatus(500);
      }
      res.sendStatus(200);
    });
  });
  return router;
};