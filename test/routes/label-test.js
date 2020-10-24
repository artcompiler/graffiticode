const { expect } = require('chai');
const express = require('express');
const request = require('supertest');

const routes = require('./../../src/routes');

describe('routes', () => {
  describe('label', () => {
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

    let app;
    beforeEach(() => {
      lastQuery = null;
      queryError = null;
      queryResult = null;
      app = express();
      app.use(express.json({ limit: '50mb' }));
      app.use('/label', routes.label(mockDbQueryFn));
    });

    it('GET /label should return label', (done) => {
      queryResult = { rows: [{ label: 'foo' }] };
      request(app)
        .get('/label')
        .query({ id: 123 })
        .expect(200, 'foo')
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(lastQuery).to.equal(`SELECT label FROM pieces WHERE id = '123'`);
          done();
        });
    });

    it('GET /label should return 500 if db error', (done) => {
      queryError = new Error('db error');
      request(app)
        .get('/label')
        .query({ id: 123 })
        .expect(500, 'Internal Server Error')
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(lastQuery).to.equal(`SELECT label FROM pieces WHERE id = '123'`);
          done();
        });
    });

    it('GET /label should return 404 if no results', (done) => {
      queryResult = { rows: [] };
      request(app)
        .get('/label')
        .query({ id: 123 })
        .expect(404, 'Not Found')
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(lastQuery).to.equal(`SELECT label FROM pieces WHERE id = '123'`);
          done();
        });
    });

    it('GET /label should select with zero id if no id given', (done) => {
      queryResult = { rows: [] };
      request(app)
        .get('/label')
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(lastQuery).to.equal(`SELECT label FROM pieces WHERE id = '0'`);
          done();
        });
    });

    it('PUT /label to update the label', (done) => {
      queryResult = { rows: [] };
      request(app)
        .put('/label')
        .set('Content-Type', 'application/json')
        .send({ id: 123, label: 'foo' })
        .expect(200, 'OK')
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(lastQuery).to.equal(`UPDATE pieces SET label = 'foo' WHERE id = '123'`);
          done();
        });
    });

    it('PUT /label to update the label', (done) => {
      queryError = new Error('failed to update');
      request(app)
        .put('/label')
        .set('Content-Type', 'application/json')
        .send({ id: 123, label: 'foo' })
        .expect(500, 'Internal Server Error')
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(lastQuery).to.equal(`UPDATE pieces SET label = 'foo' WHERE id = '123'`);
          done();
        });
    });
  });
});
