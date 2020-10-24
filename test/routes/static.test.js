const { buildHandleGet } = require('./../../src/routes/static');
const { isNonEmptyString } = require('./../../src/utils');

describe('staticRouter', () => {
  it('GET / should return 400 if no id', async () => {
    // Arrange
    const handleGet = buildHandleGet({ isNonEmptyString });
    const req = { query: { } };
    const next = jest.fn();

    // Act
    await handleGet(req, null, next);

    // Assert
    // TODO check param called with to be InvalidArgumentError
    expect(next).toHaveBeenCalled();
  });
  it('GET / should return 200 and data from provider', async () => {
    // Arrange
    const data = 'foo';
    const provider = jest.fn().mockResolvedValue(data);
    const handleGet = buildHandleGet({ isNonEmptyString, provider });
    const req = { query: { id: '123' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    // Act
    await handleGet(req, res, null);

    // Assert
    expect(provider).toHaveBeenCalledWith('123');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(data);
  });
  it('GET / call next when provider fails', async () => {
    // Arrange
    const err = 'err';
    const provider = jest.fn().mockRejectedValue(err);
    const handleGet = buildHandleGet({ isNonEmptyString, provider });
    const req = { query: { id: '123' } };
    const next = jest.fn();

    // Act
    await handleGet(req, null, next);

    // Assert
    expect(provider).toHaveBeenCalledWith('123');
    expect(next).toHaveBeenCalledWith(err);
  });
});