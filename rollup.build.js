import sourceMaps from 'rollup-plugin-sourcemaps';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/index.ts',
  output: [
    { file: 'dist/timeline.umd.js', name: 'timeline', format: 'umd', sourcemap: true },
    { file: 'dist/timeline.es.js', format: 'es', sourcemap: true },
  ],
  plugins: [
    typescript({ useTsconfigDeclarationDir: true }),
    terser(),
    sourceMaps(),
  ],
}
