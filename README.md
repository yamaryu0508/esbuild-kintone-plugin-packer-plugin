# esbuild-kintone-plugin-packer-plugin

# Sample directory structure and esbuild `build.js` for Kintone plug-in packaging

## Directory structure

```
.
├── build.js
├── dist
│   ├── html
│   │   └── config.html
│   ├── image
│   │   └── icon.png
│   ├── js
│   │   ├── config.js
│   │   ├── desktop.js
│   │   └── mobile.js
│   └── manifest.json
├── node_modules
├── package.json
├── plugin
│   ├── plugin.zip
│   └── private.ppk
├── src
│   ├── html
│   │   └── config.html
│   ├── image
│   │   └── icon.png
│   ├── manifest.json
│   └── ts
│       ├── components
│       ├── config.tsx
│       ├── desktop.tsx
│       ├── hooks
│       ├── mobile.tsx
│       ├── stores
│       └── types
├── tsconfig.json
```

## `build.js`

```js
import { typecheckPlugin } from '@jgoz/esbuild-plugin-typecheck';
import { build } from 'esbuild';
import kintonePluginPackerPlugin from 'esbuild-kintone-plugin-packer-plugin';

await build({
  entryPoints: ['./src/ts/desktop.tsx', './src/ts/mobile.tsx', './src/ts/config.tsx'],
  outdir: 'dist/js',
  plugins: [
    typecheckPlugin(),
    kintonePluginPackerPlugin({
      copyFiles: [
        ['./src/manifest.json', './dist/manifest.json'],
        ['./src/html/config.html', './dist/html/config.html'],
        ['./src/image/icon.png', './dist/image/icon.png']
      ],
      manifestJSONPath: './dist/manifest.json',
      privateKeyPath: './plugin/private.ppk',
      pluginZipPath: './plugin/plugin.zip'
    }),
  ],
  bundle: true,
  minify: true,
  target: 'es2020',
  jsx: 'automatic',
  jsxImportSource: '@emotion/react',
  watch: {
    onRebuild(error, result) {
      if (error) {
        console.error(error);
      } else {
        console.log(`esbuild rebuilt. ${JSON.stringify(result)}`);
      }
    }
  }
});
```