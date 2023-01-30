import fs, { existsSync } from 'fs';
import path from 'path';

import packer from '@kintone/plugin-packer';
import { mkdirp } from 'mkdirp';
import streamBuffers from 'stream-buffers';
import { ZipFile } from 'yazl';

// Ref. https://github.com/kintone/js-sdk/blob/master/packages/plugin-packer/src/sourcelist.ts
const sourceList = manifest => {
  const sourceTypes = [
    ['desktop', 'js'],
    ['desktop', 'css'],
    ['mobile', 'js'],
    ['mobile', 'css'],
    ['config', 'js'],
    ['config', 'css']
  ];
  const list = sourceTypes
    .map(t => manifest[t[0]] && manifest[t[0]][t[1]])
    .filter(i => !!i)
    .reduce((a, b) => a.concat(b), [])
    .filter(file => !/^https?:\/\//.test(file));
  if (manifest.config && manifest.config.html) {
    list.push(manifest.config.html);
  }
  list.push('manifest.json', manifest.icon);
  return Array.from(new Set(list));
};

// Ref. https://github.com/kintone/js-sdk/blob/master/packages/plugin-packer/src/create-contents-zip.ts
const createContentsZip = (pluginDir, manifest) => {
  return new Promise((res, rej) => {
    const output = new streamBuffers.WritableStreamBuffer();
    const zipFile = new ZipFile();
    let size = null;
    output.on('finish', () => {
      console.log(`Plug-in built: ${size} bytes`);
      res(output.getContents());
    });
    zipFile.outputStream.pipe(output);
    sourceList(manifest).forEach(src => {
      zipFile.addFile(path.join(pluginDir, src), src);
    });
    zipFile.end(undefined, finalSize => {
      size = finalSize;
    });
  });
};

// Ref. https://github.com/kintone/js-sdk/blob/master/packages/webpack-plugin-kintone-plugin/src/index.ts
const kintonePluginPackerPlugin = (options = {}) => ({
  name: 'kintone-plugin-packer',
  setup(build) {
    const {
      manifestJSONPath = './dist/manifest.json',
      privateKeyPath = './plugin/private.ppk',
      pluginZipPath = './plugin/plugin.zip',
      copyFiles = []
    } = options;

    build.onEnd(result => {
      copyFiles.forEach(([src, dest]) => {
        mkdirp.sync(path.dirname(dest));
        fs.copyFileSync(src, dest);
      });

      const pluginDir = path.dirname(manifestJSONPath);
      const manifest = JSON.parse(fs.readFileSync(manifestJSONPath, 'utf-8'));
      createContentsZip(pluginDir, manifest)
        .then(contentsZip => {
          return packer(contentsZip, existsSync(privateKeyPath) && fs.readFileSync(privateKeyPath), {
            encoding: 'utf8'
          });
        })
        .then(output => {
          console.log(`Plug-in ID: ${output.id}`);
          mkdirp.sync(path.dirname(privateKeyPath));
          fs.writeFileSync(privateKeyPath, output.privateKey);
          mkdirp.sync(path.dirname(pluginZipPath));
          fs.writeFileSync(pluginZipPath, output.plugin);
        })
        .catch(console.error);
    });
  }
});

export default kintonePluginPackerPlugin;
