#!/usr/bin/env node
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

function loadEnvFile(filename) {
  const loadedFrom = loadEnvFile.loadedFrom;
  const filePath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(filePath)) return;

  const file = fs.readFileSync(filePath, "utf8");
  for (const rawLine of file.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const idx = line.indexOf("=");
    if (idx <= 0) continue;

    const key = line.slice(0, idx).trim();
    if (!key) continue;

    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] !== undefined && loadedFrom.get(key) === "env") continue;

    process.env[key] = value;
    loadedFrom.set(key, filename);
  }
}

loadEnvFile.loadedFrom = new Map(Object.keys(process.env).map((key) => [key, "env"]));
loadEnvFile(".env");
loadEnvFile(".env.local");

const convexPackageJson = require.resolve("convex/package.json");
const cliEntrypoint = path.resolve(convexPackageJson, "../bin/main.js");
const extraArgs = process.argv.slice(2);

const child = spawn(
  process.execPath,
  [cliEntrypoint, "dev", ...extraArgs],
  {
    stdio: "inherit",
    env: process.env,
  },
);

child.on("exit", (code, signal) => {
  if (typeof code === "number") {
    process.exit(code);
  }
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(0);
  }
});
