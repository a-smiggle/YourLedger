import { rmSync } from "node:fs";
import { join } from "node:path";

const nextDirectory = join(process.cwd(), ".next");

try {
  rmSync(nextDirectory, { recursive: true, force: true });
} catch (error) {
  console.warn("Unable to clear .next before running Next.js.", error);
}