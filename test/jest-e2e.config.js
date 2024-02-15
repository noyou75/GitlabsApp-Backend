module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '../src',
  roots: ['<rootDir>', '<rootDir>/../test/'],
  testEnvironment: 'node',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '~app/(.*)': '<rootDir>/$1',
  },
  verbose: true,
};
