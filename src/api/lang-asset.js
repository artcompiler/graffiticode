function buildGetLangAsset({
  getBuffer,
}) {
  return async function getLangAsset(lang, path, resume) {
    try {
      const data = await getBuffer(`/${lang}/${path}`);
      resume(null, data);
    } catch(err) {
      resume(err);
    }
  };
}
exports.buildGetLangAsset = buildGetLangAsset;
