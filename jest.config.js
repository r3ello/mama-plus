module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['index.js'],
  coveragePathIgnorePatterns: ['/node_modules/'],
};
