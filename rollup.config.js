import resolve from '@rollup/plugin-node-resolve';
import commonJs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from "@rollup/plugin-terser";
import nodePolyfills from 'rollup-plugin-polyfill-node';
import pkg from './package.json' assert { type: 'json' };

const umdConf = {
  format: 'umd',
  name: 'ThreeForceGraph',
  globals: { three: 'THREE', 'graphology.forcelayout': 'createlayout' },
  banner: `// Version ${pkg.version} ${pkg.name} - ${pkg.homepage}`
};

export default [
  {
    external: [],
    input: 'src/index.js',
    output: [
      {
        ...umdConf,
        file: `dist/${pkg.name}.js`,
        sourcemap: true,
      },
      { // minify
        ...umdConf,
        file: `dist/${pkg.name}.min.js`,
        plugins: [terser({
          output: { comments: '/Version/' }
        })]
      }
    ],
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false,
        preserveSymlinks: true
      }),
      commonJs(),
      nodePolyfills(),
      babel({ exclude: 'node_modules/**', babelHelpers: 'bundled' })
    ]
  }
];