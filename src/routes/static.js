function buildHandleGet({ isNonEmptyString, provider }) {
  return async function handleGet(req, res, next) {
    try {
      const id = req.query.id;
      if (!isNonEmptyString(id)) {
        const err = new Error('must provide id');
        err.statusCode = 400;
        throw err;
      }
      const data = await provider(id);
      res.status(200).send(data.toString());
    } catch (providerError) {
      // TODO Translate provider error into HTTP error
      const err = providerError;
      next(err);
    }
  };
}
exports.buildHandleGet = buildHandleGet;

function buildStaticRouter({ newRouter, handleGet }) {
  const router = newRouter();
  router.get('/', handleGet);
  return router;
}
exports.buildStaticRouter = buildStaticRouter;