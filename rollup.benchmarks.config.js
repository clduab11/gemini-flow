import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import { visualizer } from 'rollup-plugin-visualizer';

const isProduction = process.env.NODE_ENV === 'production';

export default {
  input: {
    'benchmark-runner': 'src/benchmarks/benchmark-runner.ts',
    'google-services-performance': 'src/benchmarks/google-services-performance.ts',
    'load-testing-coordinator': 'src/benchmarks/load-testing-coordinator.ts',
    'performance-optimization-strategies': 'src/benchmarks/performance-optimization-strategies.ts'
  },
  output: [
    {
      dir: 'dist/benchmarks',
      format: 'es',
      sourcemap: !isProduction,
      entryFileNames: '[name].js',
      chunkFileNames: 'shared/[name]-[hash].js'
    },
    {
      dir: 'dist/benchmarks/cjs',
      format: 'cjs',
      sourcemap: !isProduction,
      entryFileNames: '[name].cjs',
      chunkFileNames: 'shared/[name]-[hash].cjs'
    }
  ],
  external: [
    // Node.js built-ins
    'crypto', 'events', 'fs', 'http', 'https', 'net', 'os', 'path', 'stream', 'url', 'util',
    'perf_hooks', 'worker_threads', 'cluster', 'child_process',
    // External dependencies
    'express', 'ws', 'redis', 'mongodb', 'kafka-node', 'prometheus-client',
    'pino', 'joi', 'lodash', 'moment', 'uuid', 'crypto-js', 'jsonwebtoken',
    'bcryptjs', 'helmet', 'cors', 'compression', 'rate-limiter-flexible',
    'bull', 'ioredis', 'pg', 'sequelize', 'mongoose', 'axios', 'node-fetch',
    'puppeteer', 'sharp', 'canvas', 'ffmpeg-static', 'jimp', 'multer',
    'socket.io', 'socket.io-client', 'eventemitter3', 'p-queue', 'p-retry',
    'p-timeout', 'async', 'rxjs', 'zod', 'dotenv', 'config'
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
          drop_console: false, // Keep console for benchmarking output
          drop_debugger: true
        },
        mangle: {
          keep_classnames: true,
          keep_fnames: true
        }
      })
    ] : []),
    visualizer({
      filename: 'dist/benchmarks/bundle-analysis.html',
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