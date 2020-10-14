const { expect } = require('chai');
const express = require('express');
const request = require('supertest');

const routes = require('./../../src/routes');

describe('routes', () => {
  describe('stat', () => {
    let lastQuery;
    let queryError;
    let queryResult;
    function mockDbQueryFn(query, resume) {
      lastQuery = query;
      if (queryError) {
        resume(queryError);
      } else {
        resume(null, queryResult);
      }
    }

    let insertItemUserId;
    let insertItemItemId;
    let insertItemError;
    function mockInsertItemFn(userId, itemId, resume) {
      insertItemUserId = userId;
      insertItemItemId = itemId;
      if (insertItemError) {
        resume(insertItemError);
      } else {
        resume(null);
      }
    }

    let app;
    beforeEach('Create app', () => {
      lastQuery = null;
      queryError = null;
      queryResult = null;
      insertItemUserId = null;
      insertItemItemId = null;
      insertItemError = null;
      app = express();
      app.use(express.json({ limit: '50mb' }));
      app.use('/stat', routes.stat(mockDbQueryFn, mockInsertItemFn));
    });

    it('GET /stat should return mark for id', (done) => {
      queryResult = { rows: [{ mark: 1 }] };
      request(app)
        .get('/stat')
        .query({ id: 123 })
        .expect(200, '[{"mark":1}]')
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(lastQuery).to.equal(`SELECT userID, itemID, mark, label FROM items WHERE itemID='123'`);
          done();
        });
    });

    it('GET /stat should return 500 if db error', (done) => {
      queryError = new Error('db error');
      request(app)
        .get('/stat')
        .query({ id: 123 })
        .expect(500, 'Internal Server Error')
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(lastQuery).to.equal(`SELECT userID, itemID, mark, label FROM items WHERE itemID='123'`);
          done();
        });
    });

    it('GET /stat should return 200 and empty array if no results', (done) => {
      queryResult = { rows: [] };
      request(app)
        .get('/stat')
        .query({ id: 123 })
        .expect(200, '[]')
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(lastQuery).to.equal(`SELECT userID, itemID, mark, label FROM items WHERE itemID='123'`);
          done();
        });
    });

    it('GET /stat should return 400 if no id given', (done) => {
      queryResult = { rows: [] };
      request(app)
        .get('/stat')
        .expect(400, 'Bad Request', done);
    });

    it('PUT /stat to update the mark', (done) => {
      queryResult = { rows: [] };
      request(app)
        .put('/stat')
        .set('Content-Type', 'application/json')
        .send({ userID: '0', itemID: '123', mark: '1' })
        .expect(200, 'OK')
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(lastQuery).to.equal(`UPDATE items SET mark='1' WHERE itemID='123'`);
          done();
        });
    });

    it('PUT /stat to update the mark with no mark set', (done) => {
      queryResult = { rows: [] };
      request(app)
        .put('/stat')
        .set('Content-Type', 'application/json')
        .send({ userID: '0', itemID: '123', mark: '' })
        .expect(200, 'OK')
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(lastQuery).to.equal(`UPDATE items SET mark=null  WHERE itemID='123'`);
          done();
        });
    });

    it('PUT /stat return 500 if insertItem fails', (done) => {
      insertItemError = new Error('failed to update');
      request(app)
        .put('/stat')
        .set('Content-Type', 'application/json')
        .send({ userID: '0', itemID: '123', mark: '1' })
        .expect(500, 'Internal Server Error')
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('PUT /stat return 500 if dbQuery fails', (done) => {
      queryError = new Error('failed to update');
      request(app)
        .put('/stat')
        .set('Content-Type', 'application/json')
        .send({ userID: '0', itemID: '123', mark: '1' })
        .expect(500, 'Internal Server Error')
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('PUT /stat return 400 if no itemID', (done) => {
      request(app)
        .put('/stat')
        .set('Content-Type', 'application/json')
        .send({ userID: '0', mark: '1' })
        .expect(400, 'Bad Request', done);
    });

    it('PUT /stat return 400 if itemID is empty string', (done) => {
      request(app)
        .put('/stat')
        .set('Content-Type', 'application/json')
        .send({ userID: '0', itemID: '', mark: '1' })
        .expect(400, 'Bad Request', done);
    });

    it('PUT /stat return 400 if no userID', (done) => {
      request(app)
        .put('/stat')
        .set('Content-Type', 'application/json')
        .send({ itemID: '123', mark: '1' })
        .expect(400, 'Bad Request', done);
    });

    it('PUT /stat return 400 if no mark', (done) => {
      request(app)
        .put('/stat')
        .set('Content-Type', 'application/json')
        .send({ userID: '0', itemID: '123' })
        .expect(400, 'Bad Request', done);
    });
  });
});
