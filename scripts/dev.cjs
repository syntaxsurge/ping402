#!/usr/bin/env node
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

function pnpmCommand() {
  return process.platform === "win32" ? "pnpm.cmd" : "pnpm";
}

function cleanNextArtifacts() {
  const nextDir = path.resolve(process.cwd(), ".next");
  fs.rmSync(nextDir, { recursive: true, force: true });
}

function spawnPnpm(scriptName) {
  const cmd = pnpmCommand();
  return spawn(cmd, ["run", scriptName], { stdio: "inherit", env: process.env });
}

cleanNextArtifacts();

const convex = spawnPnpm("convex:dev");
const next = spawnPnpm("dev:web");

function shutdown(code) {
  if (!convex.killed) convex.kill("SIGTERM");
  if (!next.killed) next.kill("SIGTERM");
  process.exit(code);
}

process.on("SIGINT", () => shutdown(130));
process.on("SIGTERM", () => shutdown(143));

convex.on("exit", (code) => shutdown(typeof code === "number" ? code : 0));
next.on("exit", (code) => shutdown(typeof code === "number" ? code : 0));

