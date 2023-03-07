// jest.config.js
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

//const esModules = ['@firebase'];

/** @type {import('jest').Config} */
const customJestConfig = {
  // TODO: this got me past the "Cannot use import statement outside of module" error
  preset: "ts-jest",
  testEnvironment: "node",
  globals: {
      'ts-jest': {
          tsconfig: './tsconfig.json',
      },
  },
  moduleDirectories: ['node_modules', '<rootDir>/'],
  moduleNameMapper: {
    '^@firebase/auth$': require.resolve('@firebase/auth'),
    '^@firebase/util$': require.resolve('@firebase/util'),
    '^@firebase/firestore$': require.resolve('@firebase/firestore'),
    '^@firebase/storage$': require.resolve('@firebase/storage'),
    '^firebase/auth$': require.resolve('firebase/auth'),
    '^firebase/firestore$': require.resolve('firebase/firestore'),
  },
  // transform: {
  //   "./.+\\.(j|t)sx?$": "ts-jest"
  // },
  transformIgnorePatterns: [
    '/node_modules/(?!(@firebase|firebase)/)',
    './node_modules/(?!(@firebase|firebase)/)',
    'node_modules/(?!@angular|@firebase|firebase|@ngrx)'
  ],
  // testEnvironment: 'jest-environment-jsdom', // TODO: trying to remove this to resolve "Cannot use import statement outside of module"
  "setupFilesAfterEnv": [
    "<rootDir>/setupTestsAfterEnv.ts"
  ],
  "extensionsToTreatAsEsm": [".ts", ".tsx"],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
// eslint-disable-next-line import/no-anonymous-default-export
export default async () => {
  const jestConfig = await createJestConfig(customJestConfig)();
  return jestConfig;
};
  