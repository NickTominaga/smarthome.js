require("./jsonc-require");

const express = require("express");
const path = require("path");
const serverConfig = require("./serverConfig.jsonc");

const app = express();
const publicDir = path.join(__dirname, "public");
const port = serverConfig.port;

if (typeof port !== "number") {
  throw new Error("serverConfig.jsonc: 'port' must be a number.");
}

app.use(express.static(publicDir));

app.get("/demo", (_req, res) => {
  res.redirect("/?demo=1");
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Nature Remo Web Controller server started: http://localhost:${port}`);
});
