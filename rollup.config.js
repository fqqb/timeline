import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.ts',
  plugins: [
    nodeResolve(),
    typescript({ tsconfig: './tsconfig.json' }),
    terser({
      output: {
        comments: false
      }
    })
  ],
  output: [{
    file: 'dist/timeline.js',
    format: 'esm',
    sourcemap: true
  }, {
    file: 'docs/assets/timeline.js',
    format: 'esm',
    sourcemap: true
  }],
  watch: {
    include: 'src/**',
  },
  onwarn: (warning, warn) => {
    // Suppress circular dependency warnings coming from Luxon
    if (warning.code === 'CIRCULAR_DEPENDENCY') return;
    warn(warning);
  },
}
