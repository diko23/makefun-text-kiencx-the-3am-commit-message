import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_OUTPUT_DIR: string = "/output";
const ENTRY_FILENAME: string = "entry.txt";
const MAX_ENTRY_CHARS: number = 139;
const ENTRY_MODE: number = 0o644;
const COMMIT_LINE: string =
  "fix: told the linter youre absolutely right 14 times then just wrote the fake stdlib method i hallucinated at 1am";

function validateEntryLine(line: string): void {
  const charCount: number = [...line].length;
  if (charCount < 1 || charCount > MAX_ENTRY_CHARS) {
    throw new Error(`Entry length ${charCount} is outside 1..${MAX_ENTRY_CHARS}`);
  }
  if (/[\r\n]/.test(line)) {
    throw new Error("Entry must be a single line");
  }
  if (line.trim().length === 0) {
    throw new Error("Entry must not be whitespace-only");
  }
}

function resolveOutputDir(): string {
  const raw: string | undefined = process.env.MAKEFUN_OUTPUT_DIR;
  const trimmed: string = raw ? raw.trim() : "";
  if (trimmed.includes("\0")) {
    throw new Error("MAKEFUN_OUTPUT_DIR must not contain null bytes");
  }
  return trimmed.length > 0 ? trimmed : DEFAULT_OUTPUT_DIR;
}

function writeEntryFile(outputDir: string, entry: string): void {
  const outputPath: string = join(outputDir, ENTRY_FILENAME);
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, entry, { encoding: "utf8", mode: ENTRY_MODE });
  chmodSync(outputPath, ENTRY_MODE);

  const written: Buffer = readFileSync(outputPath);
  const expected: Buffer = Buffer.from(entry, "utf8");
  if (!written.equals(expected)) {
    throw new Error(`Written bytes mismatch at ${outputPath}`);
  }
}

function main(): void {
  validateEntryLine(COMMIT_LINE);
  const outputDir: string = resolveOutputDir();
  writeEntryFile(outputDir, COMMIT_LINE);
}

try {
  main();
} catch (error: unknown) {
  const message: string = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
