// Headless CLI Test Runner for Aethelgard
// Execute via: node src/test/cliRunner.js  OR  ./scripts/test.ps1

import { evaluateSelfTests, runSelfTests } from './selfTest.js';

console.log('=== Aethelgard Automated Verification Suite ===');

try {
  const results = evaluateSelfTests();
  let passCount = 0;

  for (const r of results) {
    const tag = r.pass ? '[PASS]' : '[FAIL]';
    console.log(`${tag} ${r.name}`);
    if (!r.pass) {
      console.error(`       Detail: ${r.detail}`);
    } else {
      passCount += 1;
    }
  }

  const allOk = runSelfTests(false) && passCount === results.length;
  console.log('--------------------------------------------------');
  if (allOk) {
    console.log(`Result: ${passCount}/${results.length} Tests Passed. Build is healthy!`);
    process.exit(0);
  } else {
    console.error(`Result: ${passCount}/${results.length} Tests Passed. REGRESSION DETECTED!`);
    process.exit(1);
  }
} catch (err) {
  console.error('\nFATAL ERROR DURING TEST EXECUTION:');
  console.error(err);
  process.exit(1);
}
