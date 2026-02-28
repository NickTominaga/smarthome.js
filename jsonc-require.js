const fs = require("fs");

require.extensions[".jsonc"] = (module, filename) => {
  const content = fs.readFileSync(filename, "utf8");
  const normalized = normalizeJsonc(content);
  module.exports = JSON.parse(normalized);
};

function normalizeJsonc(input) {
  return input
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/,\s*([}\]])/g, "$1");
}
