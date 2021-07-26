const redis = require('redis');
const { parseJSON } = require('../utils');

const cache = process.env.REDIS_URL && redis.createClient(process.env.REDIS_URL);

const localCache = new Map();

function delCache(id, type) {
  const key = id + type;
  localCache.delete(key);
  if (cache) {
    cache.del(key);
  }
}

function renCache(id, oldType, newType) {
  const oldKey = id + oldType;
  const newKey = id + newType;
  localCache.set(newKey, localCache.get(oldKey));
  localCache.delete(oldKey);
  if (cache) {
    cache.rename(oldKey, newKey);
  }
}

function getKeys(filter, resume) {
  filter = filter || '*';
  cache.keys(filter, resume);
}

function getCache(id, type, resume) {
  const key = id + type;
  if (localCache.has(key)) {
    resume(null, localCache.get(key));
  } else if (cache) {
    cache.get(key, (err, val) => {
      if (err) {
        resume(err);
      }
      if (type === 'data') {
        val = parseJSON(val);
      }
      resume(null, val);
    });
  } else {
    resume(null, null);
  }
}

const dontCache = ['L124'];
function setCache(lang, id, type, val) {
  if (!dontCache.includes(lang)) {
    const key = id + type;
    localCache.set(key, val);
    if (cache) {
      if (type === 'data') {
        val = JSON.stringify(val);
      }
      cache.set(key, val);
    }
  }
}

exports.delCache = delCache;
exports.getCache = getCache;
exports.renCache = renCache;
exports.setCache = setCache;
