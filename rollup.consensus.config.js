import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import { visualizer } from 'rollup-plugin-visualizer';

const isProduction = process.env.NODE_ENV === 'production';

export default {
  input: 'src/protocols/a2a/security/consensus-coordinator.ts',
  output: [
    {
      file: 'dist/consensus/consensus-coordinator.js',
      format: 'es',
      sourcemap: !isProduction
    },
    {
      file: 'dist/consensus/consensus-coordinator.cjs',
      format: 'cjs',
      sourcemap: !isProduction
    }
  ],
  external: [
    // Node.js built-ins
    'crypto', 'events', 'fs', 'http', 'https', 'net', 'os', 'path', 'stream', 'url', 'util',
    // External dependencies
    'express', 'ws', 'redis', 'mongodb', 'kafka-node', 'prometheus-client',
    'pino', 'joi', 'lodash', 'moment', 'uuid', 'crypto-js', 'jsonwebtoken',
    'bcryptjs', 'helmet', 'cors', 'compression', 'rate-limiter-flexible',
    'bull', 'ioredis', 'pg', 'sequelize', 'mongoose', 'axios', 'node-fetch'
  ],
  plugins: [
    resolve({
      preferBuiltins: true,
      browser: false
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: !isProduction,
      inlineSources: !isProduction
    }),
    json(),
    ...(isProduction ? [
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        },
        mangle: {
          keep_classnames: true,
          keep_fnames: true
        }
      })
    ] : []),
    visualizer({
      filename: 'dist/consensus/bundle-analysis.html',
      open: false,
      gzipSize: true
    })
  ],
  onwarn: (warning, warn) => {
    // Suppress circular dependency warnings for known safe cases
    if (warning.code === 'CIRCULAR_DEPENDENCY') {
      return;
    }
    warn(warning);
  }
};