function buildPingLang({
  cache,
  getBuffer,
}) {
  return async function pingLang(lang, resume) {
    let pong = false;
    if (cache.has(lang)) {
      pong = cache.get(lang);
    }
    try {
      if (!pong) {
        await getBuffer(`/lang?id=${lang.slice(1)}`);
        pong = true;
      }
    } catch (err) {
      pong = false;
    }
    cache.set(lang, pong);
    resume(pong);
  };
}
exports.buildPingLang = buildPingLang;
