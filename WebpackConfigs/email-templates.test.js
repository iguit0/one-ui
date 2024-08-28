const { readdirSync, existsSync, rmSync, readFileSync } = require("fs");
const { join, resolve } = require("path");
const webpack = require("webpack");
const jsdom = require("jsdom");

const EMAIL_FACTORY_MOCK = require("path").resolve(
  "./webpack-email-config-factory.js"
);
const TEMPLATES_DIR = resolve(join("WebpackConfigs", "__fixtures__"));
const BUILD_DIR = resolve(join("build", "templates"));

jest.mock(EMAIL_FACTORY_MOCK, () => jest.fn(), { virtual: true });

let logSpy;
let globSpy;
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  processSpy = jest.spyOn(process, "exit").mockImplementation(() => {});
  promptSpy = jest
    .spyOn(require("inquirer"), "prompt")
    .mockImplementation(() => Promise.resolve({ createFactory: false }));
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

async function setupTemplateBuild(folder, resourcesOnly) {
  const folderPath = join(TEMPLATES_DIR, folder);
  if (existsSync(BUILD_DIR)) rmSync(BUILD_DIR, { recursive: true });
  process.env.NODE_ENV = "production";
  globSpy.mockImplementation(() =>
    readdirSync(folderPath)
      .filter((a) => a.includes(".tsx"))
      .map((a) => join(folderPath, a))
  );
  require(EMAIL_FACTORY_MOCK).mockImplementation((...args) => ({
    config:
      require("@muritavo/webpack-microfrontend-scripts/bin/react/scripts/_webpackConfiguration").createBaseConfiguration(
        ...args
      ),
    baseHtml: "mock",
    resourcesOnly,
  }));

  /**@type {import("webpack").Configuration} */
  const config = await require("./email-templates")();

  return webpack({
    ...config,
    stats: "none",
  });
}

function run(webpack, assert) {
  return new Promise((res, rej) => {
    webpack.run((e, r) => {
      if (e) rej(e);
      else if (r.hasErrors()) rej(r.compilation.errors[0]);
      else
        assert()
          .then(() => res())
          .catch((e) => {
            rej(e);
          });
    });
  });
}

it("Should be able to generate single compilation for multiple entries", async () => {
  const webpack = setupTemplateBuild("email_templates", true);

  expect(config.entry).toHaveLength(2);

  return run(webpack, () => {
    function assertFileExists(path) {
      expect(existsSync(join(BUILD_DIR, path))).toBeTruthy();
    }
    assertFileExists("static", "media", "asset1.png");
    assertFileExists("static", "media", "asset2.png");
  });
});

describe("BUGFIX", () => {
  it.only("Should be able to extract color from var based config", async () => {
    const webpack = await setupTemplateBuild("bug_var_color", false);
    /**
     * For some reason, at rarum email generation, it's not extracting custom color for the html tag
     * When running on dev, we can see the html tag has a var based color set...
     *
     * Maybe JSDOM can't handle it?
     *
     * Let's make a cenario
     * body => var x = green
     * body > table > tr > td > p:nth(1) = Has red inline scss color
     * body > table > tr > td > p:nth(1) = Has var(--x) scss color
     *
     * The final html should have red and green text
     */
    return run(webpack, async () => {
      const htmlStr = readFileSync(
        join("templates", "cenario.html")
      ).toString();
      const html = new jsdom.JSDOM(htmlStr).window.document;
      const buttons = Array.from(html.querySelectorAll("button"));
      for (let button of buttons)
        expect(button.style.backgroundColor).toEqual("green");
    });
  });
});
