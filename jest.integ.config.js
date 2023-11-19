module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/test/integ"],
  testMatch: ["**/*.test.integ.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
};
