'use strict';
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  collectCoverageFrom: ['api/**/*.js', 'scripts/lib/**/*.js'],
  coverageReporters: ['text-summary', 'lcov'],
  coverageThreshold: { global: { statements: 85, branches: 70, functions: 85, lines: 85 } },
};
