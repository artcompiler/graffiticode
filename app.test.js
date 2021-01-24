const app = require('./app');
const express = require('express');
const { Pool } = require('pg');
const request = require('supertest');

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

jest.mock('express', () => {
  let staticHandler = jest.fn((req, res, next) => next());
  const actual = jest.requireActual('express');
  actual.static = jest.fn(_ => staticHandler);
  return actual;
});

describe('app', () => {
  let pool;
  beforeEach(() => {
    pool = new Pool();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should return fonts', async () => {
    express.static().mockImplementation((u1, res, u2) => res.status(200).send('this is a test.\n'));

    // Act
    await request(app)
      .get('/fonts/test.txt')
      .query({ id: 123 })
      .expect(200, 'this is a test.\n');

    // Assert
  });
  it('should /lang redirect to languages last item', async () => {
    // Arrange
    function buildQueryImpl(err, data) {
      return (query, resume) =>  setTimeout(() => resume(err, data), 0);
    }
    const itemid = '456';
    pool.query.mockImplementationOnce(buildQueryImpl(null, { rows: [{ itemid }], rowCount: 1 }));

    // Act
    await request(app)
      .get('/lang')
      .query({ id: 123 })
      .expect(302, `Found. Redirecting to /item?id=${itemid}`);

    // Assert
  });
  it('should /lang no id returns 400', async () => {
    // Arrange

    // Act
    await request(app)
      .get('/lang')
      .expect(400, `must provide language id`);

    // Assert
  });
  it('should /lang non integer returns 400', async () => {
    // Arrange

    // Act
    await request(app)
      .get('/lang')
      .query({ id: 'foo' })
      .expect(400, `language id must be an integer`);

    // Assert
  });
});