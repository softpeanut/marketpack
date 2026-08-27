import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { parseArgs, runPack } from "./pack.mjs";

function imageSize(path) {
  const result = spawnSync("/usr/bin/sips", ["-g", "pixelWidth", "-g", "pixelHeight", path], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return [Number(result.stdout.match(/pixelWidth:\s*(\d+)/)[1]), Number(result.stdout.match(/pixelHeight:\s*(\d+)/)[1])];
}

test("validates bounded service arguments", () => {
  assert.throws(() => parseArgs(["--input", "in", "--output", "out"]), /one or two/);
  assert.throws(() => parseArgs(["--input", "in", "--output", "out", "--target", "bad"]), /Invalid target/);
  assert.throws(() => parseArgs(["--input", "in", "--output", "out", "--target", "a:1x1", "--target", "a:2x2"]), /unique/);
});

test("creates exact contain and cover outputs without changing input", () => {
  const root = mkdtempSync(join(tmpdir(), "marketpack-service-test-"));
  try {
    const input = join(root, "input");
    mkdirSync(input);
    const svg = join(root, "fixture.svg");
    const source = join(input, "source.png");
    writeFileSync(svg, '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="40"><rect width="80" height="40" fill="#4477aa"/></svg>');
    const conversion = spawnSync("/usr/bin/sips", ["-s", "format", "png", svg, "--out", source], { encoding: "utf8" });
    assert.equal(conversion.status, 0, conversion.stderr);
    const before = readFileSync(source);

    const containOutput = join(root, "contain");
    const contain = runPack(parseArgs(["--input", input, "--output", containOutput, "--target", "square:64x64", "--slug", "blue-card"]));
    assert.deepEqual({ sources: contain.sources, outputs: contain.outputs }, { sources: 1, outputs: 1 });
    assert.deepEqual(imageSize(join(containOutput, "square", "blue-card-01-square.jpg")), [64, 64]);

    const coverOutput = join(root, "cover");
    runPack(parseArgs(["--input", input, "--output", coverOutput, "--target", "portrait:40x60", "--mode", "cover"]));
    assert.deepEqual(imageSize(join(coverOutput, "portrait", "product-01-portrait.jpg")), [40, 60]);
    assert.deepEqual(readFileSync(source), before);
  } finally {
    rmSync(root, { recursive: true, force: false });
  }
});
