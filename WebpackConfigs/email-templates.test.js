const { readdirSync, existsSync, rmSync } = require("fs");
const { join, resolve } = require("path");
const webpack = require("webpack");

const EMAIL_FACTORY_MOCK = require("path").resolve(
  "./webpack-email-config-factory.js"
);
const TEMPLATES_DIR = resolve(
  join("WebpackConfigs", "__fixtures__", "email_templates")
);
const BUILD_DIR = resolve(join("build", "templates"));

jest.mock(EMAIL_FACTORY_MOCK, () => jest.fn(), { virtual: true });

let logSpy;
let processSpy;
let promptSpy;
let globSpy;
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  processSpy = jest.spyOn(process, "exit").mockImplementation(() => {});
  promptSpy = jest
    .spyOn(require("inquirer"), "prompt")
    .mockImplementation(() => Promise.resolve({ createFactory: false }));
  const originalLog = console.log;
  logSpy = jest.spyOn(console, "log").mockImplementation((...args) => {
    if (typeof args[0] !== "string" || !args[0].includes("./custom-config.js"))
      originalLog(...args);
  });
  globSpy = jest.spyOn(require("glob"), "sync");
  process.env.EMAIL_TEMPLATES_BASE_DOMAIN = "http://localhost";
});

function customWebpackConfigCenario() {
  require(EMAIL_FACTORY_MOCK).mockImplementation((...args) => ({
    config:
      require("@muritavo/webpack-microfrontend-scripts/bin/react/scripts/_webpackConfiguration").createBaseConfiguration(
        ...args
      ),
    baseHtml: "mock",
  }));
}

it("Should generate the file correctly when using proprietary webpack config", async () => {
  customWebpackConfigCenario();
  await require("./email-templates")();
});

it.each(["development", "production"])(
  "Should work when using a react-scripts config",
  async (environment) => {
    require(EMAIL_FACTORY_MOCK).mockImplementation(() => ({
      config: require("react-scripts/config/webpack.config")(environment),
    }));
    await require("./email-templates")();
  }
);

it("Should warn the user when there are no templates mapped", async () => {
  require(EMAIL_FACTORY_MOCK).mockImplementation(() => ({
    config: require("react-scripts/config/webpack.config")("development"),
  }));
  await require("./email-templates")();
  expect(logSpy.mock.calls).toMatchSnapshot();
});

it.only("Should be able to generate single compilation for multiple entries", async () => {
  if (existsSync(BUILD_DIR)) rmSync(BUILD_DIR, { recursive: true });
  process.env.NODE_ENV = "production";
  globSpy.mockImplementation(() =>
    readdirSync(TEMPLATES_DIR)
      .filter((a) => a.includes(".tsx"))
      .map((a) => join(TEMPLATES_DIR, a))
  );
  require(EMAIL_FACTORY_MOCK).mockImplementation((...args) => ({
    config:
      require("@muritavo/webpack-microfrontend-scripts/bin/react/scripts/_webpackConfiguration").createBaseConfiguration(
        ...args
      ),
    baseHtml: "mock",
    resourcesOnly: true,
  }));
  /**@type {import("webpack").Configuration} */
  const config = await require("./email-templates")();

  expect(config.entry).toHaveLength(2);

  return new Promise((res, rej) => {
    webpack({
      ...config,
      stats: "none",
    }).run((e, r) => {
      if (e) rej(e);
      else if (r.hasErrors()) rej(r.compilation.errors[0]);
      else {
        function assertFileExists(path) {
          expect(existsSync(join(BUILD_DIR, path))).toBeTruthy();
        }
        assertFileExists("static", "media", "asset1.png");
        assertFileExists("static", "media", "asset2.png");
        res();
      }
    });
  });
});
