import serve from 'rollup-plugin-serve';
import sourceMaps from 'rollup-plugin-sourcemaps';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/index.ts',
  output: [
    { file: 'examples/js/timeline.es.js', format: 'es', sourcemap: true },
  ],
  watch: {
    include: 'src/**',
  },
  plugins: [
    typescript({ useTsconfigDeclarationDir: true }),
    // terser(),
    sourceMaps(),
    serve({
      contentBase: 'examples',
      port: 3000,
    })
  ],
}
