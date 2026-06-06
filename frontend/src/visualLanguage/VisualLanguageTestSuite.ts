import { VisualLanguageRegistry } from './VisualLanguageRegistry';

function runTests() {
  console.log('==================================================');
  console.log('🧪 RUNNING TACTICAL VISUAL LANGUAGE TEST SUITE   ');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, message?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${message ? `: ${message}` : ''}`);
      failed++;
    }
  }

  // 1. Registry Completeness
  const report = VisualLanguageRegistry.validate();
  assert('Registry holds all 13 canonical event types', report.valid && report.registered === 13, 
    `Registered: ${report.registered}, Missing: ${JSON.stringify(report.missing)}`
  );

  // 2. Uniqueness of visual signatures
  const signatures = VisualLanguageRegistry.getAllSignatures();
  const visualKeys = new Set<string>();
  let duplicatesFound = false;

  signatures.forEach(sig => {
    const color = sig.overlay?.color ?? sig.arrow?.color ?? 'none';
    const mode = sig.overlay?.mode ?? 'none';
    const dashed = sig.arrow?.dashed ?? false;
    const key = `${color}_${mode}_${dashed}`;
    if (visualKeys.has(key)) {
      duplicatesFound = true;
    }
    visualKeys.add(key);
  });
  assert('All visual signatures are visually unique (color + dash + render mode combination)', !duplicatesFound, 
    'Found signatures with duplicate style signatures'
  );

  // 3. Historical mode theme transformation
  let historicalCheckPassed = true;
  signatures.forEach(sig => {
    if (sig.hasHistoricalVariant) {
      const historicalSig = VisualLanguageRegistry.getSignature(sig.eventType, 'historical');
      if (sig.arrow && historicalSig.arrow) {
        if (sig.arrow.color === historicalSig.arrow.color || sig.arrow.opacity === historicalSig.arrow.opacity) {
          historicalCheckPassed = false;
        }
      }
      if (sig.overlay && historicalSig.overlay) {
        if (sig.overlay.color === historicalSig.overlay.color || sig.overlay.opacity === historicalSig.overlay.opacity) {
          historicalCheckPassed = false;
        }
      }
    }
  });
  assert('Historical mode produces modified visual colors and scales opacities correctly', historicalCheckPassed);

  // 4. Accessibility compliance checks
  let accessibilityCheckPassed = true;
  const shapeIds = new Set<string>();
  
  signatures.forEach(sig => {
    if (!sig.accessibility.shapeId || !sig.accessibility.motionDescription || !sig.accessibility.timingPattern) {
      accessibilityCheckPassed = false;
    }
    shapeIds.add(sig.accessibility.shapeId);
  });

  assert('Accessibility profiles include distinct shapeId, motionDescription, and timing patterns', accessibilityCheckPassed);
  assert('All 13 signatures use unique non-color shape identifiers', shapeIds.size === 13, `Only found ${shapeIds.size} unique shape IDs.`);

  // 5. Performance benchmark scenario: simulate rendering overhead
  const startPerf = performance.now();
  for (let i = 0; i < 1000; i++) {
    signatures.forEach(sig => {
      VisualLanguageRegistry.getSignature(sig.eventType, 'concept');
      VisualLanguageRegistry.getSignature(sig.eventType, 'historical');
    });
  }
  const duration = performance.now() - startPerf;
  assert('Performance: Resolving 13,000 styles is fast (latency < 60ms)', duration < 60, `Took ${duration.toFixed(2)}ms`);

  console.log('\n==================================================');
  console.log(`📊 SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
