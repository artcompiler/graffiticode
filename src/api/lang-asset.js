exports.buildGetLangAsset = ({ getBuffer }) => {
  return async function getLangAsset(lang, path, resume) {
    if (!(typeof resume === 'function')) {
      console.trace();
    }
    try {
      const data = await getBuffer(`/${lang}/${path}`);
      resume(null, data);
    } catch(err) {
      resume(err);
    }
  };
};
