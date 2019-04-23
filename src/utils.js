
function getCompilerHost(lang, config) {
  if (config.hosts.get(lang)) {
    return config.hosts.get(lang);
  }
  if (config.isLocalCompiler) {
    return 'localhost';
  }
  return `${lang}.artcompiler.com`;
}
exports.getCompilerHost = getCompilerHost;

function getCompilerPort(lang, config) {
  if (config.ports.get(lang)) {
    return config.ports.get(lang);
  }
  if (config.isLocalCompiler) {
    return `5${lang.substring(1)}`;
  }
  return '80';
}
exports.getCompilerPort = getCompilerPort;