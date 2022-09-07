import { nodeResolve } from '@rollup/plugin-node-resolve';

const { dependencies, peerDependencies } = require(__dirname + '/package.json');
const external = [
  ...Object.keys(dependencies || {}),
  ...Object.keys(peerDependencies || {}),
];

function createRollupConfig() {
  const config = {
    input: 'src/index.mjs',
    treeshake: {
      moduleSideEffects: 'no-external',
    },
    plugins: [nodeResolve()],
    external,
    output: [
      {
        dir: './dist',
        entryFileNames: '[name].cjs',
        format: 'cjs',
        exports: 'named',
      },
      {
        dir: './dist',
        entryFileNames: '[name].js',
        format: 'cjs',
        exports: 'named',
      },
      {
        dir: './dist',
        entryFileNames: '[name].mjs',
        format: 'esm',
        exports: 'named',
      },
    ],
  };

  return config;
}

export default createRollupConfig();
