import { readFileSync } from "node:fs";

const file = process.argv[2];
const report = JSON.parse(readFileSync(file, "utf8"));
const failed = report.numFailedTests ?? 0;
const passed = report.numPassedTests ?? 0;
const blob = JSON.stringify(report);
if (passed !== 0 || failed < 1 || !blob.includes("LEARNER_TODO")) {
  console.error(`learner checks must fail with LEARNER_TODO and zero passes (passed=${passed}, failed=${failed})`);
  process.exit(1);
}
console.log(`learner checks failed as expected (${failed})`);
