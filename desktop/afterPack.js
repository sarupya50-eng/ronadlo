// electron-builder never copies node_modules folders into extraResources,
// so copy the server's dependencies into the packaged app by hand.
const fs = require("fs");
const path = require("path");

exports.default = async function (context) {
  const src = path.resolve(__dirname, "..", ".next", "standalone", "node_modules");
  const resources = path.join(context.appOutDir, "resources");
  const dest = path.join(resources, "server", "node_modules");
  if (!fs.existsSync(src)) throw new Error("Missing " + src + " - run prepare.js first");
  fs.cpSync(src, dest, { recursive: true });
  console.log("afterPack: copied server node_modules ->", dest);
};
