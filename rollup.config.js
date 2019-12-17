import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/index.ts',
  plugins: [
    typescript({
      useTsconfigDeclarationDir: true
    }),
    terser({
      output: {
        comments: false
      }
    })
  ],
  output: [
    {
      file: 'dist/timenav.umd.js',
      name: 'tn',
      format: 'umd',
      sourcemap: true
    }, {
      file: 'dist/timenav.js',
      format: 'esm',
      sourcemap: true
    }, {
      file: 'docs/assets/timenav.js',
      format: 'esm',
      sourcemap: true
    }
  ],
  watch: {
    include: 'src/**',
  }
}
