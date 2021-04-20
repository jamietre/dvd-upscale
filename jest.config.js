const env = {
  NODE_ENV: "jest-test",
  LOCALSTACK_HOSTNAME: process.env.LOCALSTACK_HOSTNAME || "localhost",
  RW_ENV: process.env.RW_ENV || "localstack",
  RW_IS_COMPILED: "",
};
Object.assign(process.env, env);

const { defaults: tsjPreset } = require("ts-jest/presets");

let testRegex = ["(/__tests__/.*|\\.test)\\.[jt]sx?$"];

// https://jestjs.io/docs/en/configuration.html
module.exports = {
  automock: false,
  clearMocks: true,
  collectCoverage: false,

  // Code coverage of TSX files is excessive
  collectCoverageFrom: ["**/*.ts", "!**/node_modules/**"],
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: ["\\\\node_modules\\\\"],
  //testPathIgnorePatterns: [],
  roots: ["<rootDir>/src"],
  // moduleNameMapper: tsJestAliases,
  // setupFiles: ["./jest.setup.js"],
  snapshotSerializers: ["enzyme-to-json/serializer"],
  testEnvironment: "node",
  testRegex,
  transform: {
    ...tsjPreset.transform,
  },
  preset: "ts-jest",
  globals: {},
};
