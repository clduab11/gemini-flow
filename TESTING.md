# Testing Guide

This repository uses multiple Jest configurations for different test suites:

- Primary unit/integration: `jest.config.cjs`
- Protocol-focused tests: `jest.protocols.config.js` (invoked by a runner script)

## Commands

- Unit/integration/performance: `npm test`
- Protocols runner: `npm run test:protocols:runner`
- Watch mode: `npm run test:watch`

## Notes

- Type-checking (`npm run typecheck`) targets application source (`src/`) only to avoid test type overlaps. Jest handles test transpilation independently via `ts-jest` and Babel presets defined in config files.
- Protocol tests can also be executed directly: `node scripts/test-protocols.js`.

