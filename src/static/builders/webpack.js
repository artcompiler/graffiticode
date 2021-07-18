const { getLangAsset } = require('./../../api');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const { link } = require('linkfs');
const { createFsFromVolume, Volume } = require('memfs');
const path = require('path');
const { ufs } = require('unionfs');
const webpack = require('webpack');

function compilerRun(compiler) {
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
        return;
      }
      const statsInfo = stats.toJson({ modules: false });
      if (stats.hasErrors()) {
        if (statsInfo.errors.length > 0) {
          reject(new Error(statsInfo.errors[0]));
        } else {
          let err;
          statsInfo.children.forEach(c => {
            if (!err && c.errors.length > 0) {
              err = c.errors[0];
            }
          });
          reject(new Error(err));
        }
      } else {
        resolve(statsInfo);
      }
    });
  });
}

function buildMkdirp({ fs, path }) {
  return function mkdirp(dirname, callback) {
    fs.mkdir(dirname, { recursive: true }, (err) => {
      if (err) {
        if (err.code !== 'ENOENT') {
          callback(err);
        } else {
          mkdirp(path.dirname(dirname), callback);
        }
      } else {
        callback();
      }
    });
  };
}

async function getLangAssets(fs, langId) {
  let [
    viewerJs,
    styleCss,
  ] = await Promise.all([
    new Promise((resolve, reject) => {
      getLangAsset(`L${langId}`, 'viewer.js', (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    }),
    new Promise((resolve, reject) => {
      getLangAsset(`L${langId}`, 'style.css', (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    })
    .catch((err) => {
      console.log(`Failed to get style.css for L${langId}: ${err.message}`);
      return Buffer.from('');
    }),
  ]);
 
  await Promise.all([
    fs.promises.writeFile(path.join(__dirname, 'runfiles', 'language-viewer.js'), viewerJs),
    fs.promises.writeFile(path.join(__dirname, 'runfiles', 'language-style.css'), styleCss),
  ]);
}

exports.buildWebpackBuilder = ({
  decodeID,
  getPiece,
  compileID,
}) => {
  return async function webpackBuilder(id) {
    let [langId, codeId] = decodeID(id);

    if (codeId === 0) {
      const err = new Error(`${id} not found`);
      err.statusCode = 404;
      throw err;
    }

    if (langId === 0) {
      langId = await new Promise((resolve, reject) => {
        getPiece(codeId, (err, row) => {
          if (err) {
            reject(err);
          } else if (!row) {
            const err = new Error(`${id} not found`);
            err.statusCode = 404;
            reject(err);
          } else {
            let lang = row.language;
            if (lang.charAt(0) === 'L') {
              lang = lang.substring(1);
            }
            resolve(lang);
          }
        });
      });
    }

    const [data, info, obj] = await Promise.all([
      Promise.resolve({}),
      Promise.resolve({ id, langId, codeId }),
      new Promise((resolve, reject) => {
        compileID(/*auth=*/null, id, /*options=*/{}, (err, obj) => {
          if (err) {
            reject(err)
          } else {
            resolve(obj);
          }
        });
      }),
    ]);

    const mfs = createFsFromVolume(new Volume());
    mfs.join = path.join;
    mfs.mkdirp = buildMkdirp({ fs: mfs, path });
    await new Promise((resolve, reject) => {
      mfs.mkdirp(path.join(__dirname, 'runfiles'), (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    await Promise.all([
      mfs.promises.writeFile(path.join(__dirname, 'runfiles', 'data.json'), JSON.stringify(data)),
      mfs.promises.writeFile(path.join(__dirname, 'runfiles', 'info.json'), JSON.stringify(info)),
      mfs.promises.writeFile(path.join(__dirname, 'runfiles', 'obj.json'), JSON.stringify(obj)),
      getLangAssets(mfs, langId),
    ]);

    const lfs = link(fs, []);
    const u = ufs.use(lfs).use(mfs);
    u.join = path.join;
    u.mkdirp = buildMkdirp({ fs: u, path });

    const config = {
      mode: 'production',
      entry: {
        app: path.join(__dirname, 'runfiles', 'index.js'),
      },
      module: {
        rules: [{
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: { loader: 'babel-loader' },
        }, {
          test: /\.html$/,
          use: { loader: 'html-loader' },
        }, {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        }],
      },
      plugins: [
        new HtmlWebpackPlugin({
          title: `L${langId}`,
          favicon: path.join(__dirname, 'runfiles', 'favicon.png'),
          template: path.join(__dirname, 'runfiles', 'index.html'),
          inlineSource: '.(js|css)$',
        }),
        new HtmlWebpackInlineSourcePlugin(HtmlWebpackPlugin),
      ],
      output: {
        filename: '[name].bundle.js',
        path: path.join(__dirname, 'dist'),
      },
    };
    const compiler = webpack(config);
    compiler.inputFileSystem = u;
    compiler.outputFileSystem = mfs;

    await compilerRun(compiler);

    return await u.promises.readFile(path.join(__dirname, 'dist', 'index.html'));
  };
};
