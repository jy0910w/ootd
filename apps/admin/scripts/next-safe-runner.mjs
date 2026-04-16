import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const nextArgs = process.argv.slice(2);

if (nextArgs.length === 0) {
  throw new Error("Usage: node scripts/next-safe-runner.mjs <next-args>");
}

const LOCALSTORAGE_FLAG = /^--localstorage-file(?:$|=)/;

function sanitizeNodeOptions(rawValue) {
  if (!rawValue || !rawValue.trim()) {
    return "";
  }

  const tokens = rawValue.match(/"[^"]*"|'[^']*'|\S+/g) ?? [];
  const kept = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (LOCALSTORAGE_FLAG.test(token)) {
      if (token === "--localstorage-file" && index + 1 < tokens.length && !tokens[index + 1].startsWith("--")) {
        index += 1;
      }
      continue;
    }

    kept.push(token);
  }

  return kept.join(" ");
}

const originalNodeOptions = process.env.NODE_OPTIONS ?? "";
const originalNpmNodeOptions = process.env.npm_config_node_options ?? "";
const originalNpmNodeOptionsUpper = process.env.NPM_CONFIG_NODE_OPTIONS ?? "";

const sanitizedNodeOptions = sanitizeNodeOptions(originalNodeOptions);
const sanitizedNpmNodeOptions = sanitizeNodeOptions(originalNpmNodeOptions);
const sanitizedNpmNodeOptionsUpper = sanitizeNodeOptions(originalNpmNodeOptionsUpper);

const env = { ...process.env };
if (sanitizedNodeOptions.length > 0) {
  env.NODE_OPTIONS = sanitizedNodeOptions;
} else {
  delete env.NODE_OPTIONS;
}

if (sanitizedNpmNodeOptions.length > 0) {
  env.npm_config_node_options = sanitizedNpmNodeOptions;
} else {
  delete env.npm_config_node_options;
}

if (sanitizedNpmNodeOptionsUpper.length > 0) {
  env.NPM_CONFIG_NODE_OPTIONS = sanitizedNpmNodeOptionsUpper;
} else {
  delete env.NPM_CONFIG_NODE_OPTIONS;
}

const removedFromNodeOptions =
  originalNodeOptions !== sanitizedNodeOptions ||
  originalNpmNodeOptions !== sanitizedNpmNodeOptions ||
  originalNpmNodeOptionsUpper !== sanitizedNpmNodeOptionsUpper;

if (removedFromNodeOptions) {
  process.stderr.write("[admin] Removed `--localstorage-file` from Node option env vars.\n");
}

const nextBinPath = path.resolve(process.cwd(), "node_modules/next/dist/bin/next");

const child = spawn(process.execPath, ["--no-experimental-webstorage", nextBinPath, ...nextArgs], {
  stdio: "inherit",
  env,
  shell: false
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
