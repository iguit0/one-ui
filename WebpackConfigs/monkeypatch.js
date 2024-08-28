const { resolveFromMainContext } = require("./workarounds");

const parsersModule = require(resolveFromMainContext("cssstyle/lib/parsers"));

/**
 *
 * @param {keyof typeof parsersModule} key
 */
function keepVars(key) {
  const original = parsersModule[key];
  parsersModule[key] = (...args) => {
    if (args[0].startsWith("var(--")) {
      return args[0];
    }
    return original(...args);
  };
}

keepVars("parseColor");
