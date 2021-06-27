module.exports = {
  preset: 'ts-jest',
  testEnvironment: "jsdom",
  transform: {
      "^.+\\.ts?$": "ts-jest",
      "^.+\\.js$": "babel-jest",
      ".+\\.(css|styl|less|sass|scss)$": "jest-transform-css"
  },
  "moduleNameMapper":{
       "\\.(css|less|sass|scss)$": "<rootDir>/tests/styleMock.js",
       "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/tests/fileMock.js"
  },
  "transformIgnorePatterns": [
    "/node_modules/(?!@jupyterlab)"
  ],
  globals: {
    "ts-jest": {
      // in tsconfig.test.json rootDir needs to be a common parent of both tests/ and src/
      tsConfig: "tsconfig.test.json",
    },
  },
};
