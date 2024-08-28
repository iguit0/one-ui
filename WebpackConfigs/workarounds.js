/** A.K.A. Gambiarras */

const { resolve } = require("path");

const Module = require("module").Module;
function resolveFromMainContext(module) {
  try {
    return Module._resolveFilename(module, require.main);
  } catch (e) {
    return require.resolve(resolve("node_modules", module));
  }
}
module.exports = {
  resolveFromMainContext,
};
