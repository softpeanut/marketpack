#!/usr/bin/env node
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, renameSync, rmSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const SIPS = "/usr/bin/sips";
const SOURCE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function fail(message) {
  throw new Error(message);
}

function nextValue(argv, index, flag) {
  if (!argv[index + 1] || argv[index + 1].startsWith("--")) fail(`${flag} requires a value`);
  return argv[index + 1];
}

export function parseArgs(argv) {
  const config = { targets: [], mode: "contain", background: "FFFFFF", quality: 90, slug: "product" };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === "--input") config.input = nextValue(argv, index++, flag);
    else if (flag === "--output") config.output = nextValue(argv, index++, flag);
    else if (flag === "--target") config.targets.push(nextValue(argv, index++, flag));
    else if (flag === "--mode") config.mode = nextValue(argv, index++, flag);
    else if (flag === "--background") config.background = nextValue(argv, index++, flag);
    else if (flag === "--quality") config.quality = Number(nextValue(argv, index++, flag));
    else if (flag === "--slug") config.slug = nextValue(argv, index++, flag);
    else fail(`Unknown argument: ${flag}`);
  }

  if (!config.input || !config.output) fail("--input and --output are required");
  if (config.targets.length < 1 || config.targets.length > 2) fail("Provide one or two --target values");
  if (!new Set(["contain", "cover"]).has(config.mode)) fail("--mode must be contain or cover");
  if (!/^[0-9A-Fa-f]{6}$/.test(config.background)) fail("--background must be a six-digit hex color");
  if (!Number.isInteger(config.quality) || config.quality < 70 || config.quality > 100) fail("--quality must be an integer from 70 to 100");
  if (!/^[a-z0-9][a-z0-9-]{0,69}$/.test(config.slug)) fail("--slug must be lowercase letters, digits, and hyphens");

  config.targets = config.targets.map((value) => {
    const match = value.match(/^([a-z0-9][a-z0-9-]{0,31}):([1-9]\d{0,4})x([1-9]\d{0,4})$/);
    if (!match) fail(`Invalid target: ${value}`);
    const width = Number(match[2]);
    const height = Number(match[3]);
    if (width > 10000 || height > 10000) fail(`Target exceeds 10000px: ${value}`);
    return { name: match[1], width, height };
  });
  if (new Set(config.targets.map(({ name }) => name)).size !== config.targets.length) fail("Target names must be unique");
  return config;
}

function runSips(args) {
  const result = spawnSync(SIPS, args, { encoding: "utf8" });
  if (result.status !== 0) fail(`sips failed: ${(result.stderr || result.stdout).trim()}`);
  return result.stdout;
}

function dimensions(path) {
  const output = runSips(["-g", "pixelWidth", "-g", "pixelHeight", path]);
  const width = Number(output.match(/pixelWidth:\s*(\d+)/)?.[1]);
  const height = Number(output.match(/pixelHeight:\s*(\d+)/)?.[1]);
  if (!width || !height) fail(`Could not read image dimensions: ${basename(path)}`);
  return { width, height };
}

function transform(source, destination, target, config) {
  runSips(["-s", "format", "jpeg", "-s", "formatOptions", String(config.quality), source, "--out", destination]);
  const sourceSize = dimensions(destination);
  const scale = config.mode === "cover"
    ? Math.max(target.width / sourceSize.width, target.height / sourceSize.height)
    : Math.min(target.width / sourceSize.width, target.height / sourceSize.height);
  const width = Math.max(1, Math.round(sourceSize.width * scale));
  const height = Math.max(1, Math.round(sourceSize.height * scale));
  runSips(["--resampleHeightWidth", String(height), String(width), destination]);
  if (config.mode === "cover") runSips(["--cropToHeightWidth", String(target.height), String(target.width), destination]);
  else runSips(["--padToHeightWidth", String(target.height), String(target.width), "--padColor", config.background.toUpperCase(), destination]);
  const finalSize = dimensions(destination);
  if (finalSize.width !== target.width || finalSize.height !== target.height) fail(`Unexpected output size for ${basename(destination)}`);
}

export function runPack(config) {
  if (!existsSync(SIPS)) fail("This delivery harness requires macOS /usr/bin/sips");
  const input = resolve(config.input);
  const output = resolve(config.output);
  if (!existsSync(input) || !lstatSync(input).isDirectory()) fail("Input must be an existing directory");
  if (existsSync(output)) fail("Output path must not already exist");
  const outputParent = dirname(output);
  if (!existsSync(outputParent) || !lstatSync(outputParent).isDirectory()) fail("Output parent must be an existing directory");

  const files = readdirSync(input)
    .map((name) => ({ name, path: join(input, name) }))
    .filter(({ name, path }) => SOURCE_EXTENSIONS.has(extname(name).toLowerCase()) && lstatSync(path).isFile() && !lstatSync(path).isSymbolicLink())
    .sort((left, right) => left.name.localeCompare(right.name));
  if (files.length < 1 || files.length > 20) fail("Input must contain 1–20 regular JPG, PNG, or WebP files");

  const temporary = mkdtempSync(join(outputParent, ".marketpack-service-"));
  try {
    for (const target of config.targets) mkdirSync(join(temporary, target.name));
    files.forEach((file, index) => {
      const sequence = String(index + 1).padStart(2, "0");
      for (const target of config.targets) {
        const destination = join(temporary, target.name, `${config.slug}-${sequence}-${target.name}.jpg`);
        transform(file.path, destination, target, config);
      }
    });
    renameSync(temporary, output);
  } catch (error) {
    rmSync(temporary, { recursive: true, force: false });
    throw error;
  }
  return { sources: files.length, outputs: files.length * config.targets.length, output };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = runPack(parseArgs(process.argv.slice(2)));
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
