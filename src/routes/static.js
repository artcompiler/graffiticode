exports.buildHandleGet = ({ isNonEmptyString, provider }) => {
  return async function handleGet(req, res, next) {
    try {
      const id = req.query.id;
      if (!isNonEmptyString(id)) {
        const err = new Error('must provide id');
        err.statusCode = 400;
        throw err;
      }
      const url = await provider(id);
      res.redirect(url);
    } catch (providerError) {
      // TODO Translate provider error into HTTP error
      const err = providerError;
      next(err);
    }
  };
};

exports.buildStaticRouter = ({ newRouter, handleGet }) => {
  const router = newRouter();
  router.get('/', handleGet);
  return router;
};
