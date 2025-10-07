# Quality & Safety Integration Tests

## Test 1: Basic Quality & Safety (Happy Path)
Create a simple workflow with quality and safety requirements enabled.

Expected: All validations pass, quality score >= 0.85, audit logged

## Test 2: Automatic Rerun on Low Quality
Create workflow with quality threshold 0.9 but expect lower quality.

Expected: Automatic rerun triggered, attempt count shown

## Test 3: Maximum Reruns Reached
Force multiple quality failures to hit max rerun limit.

Expected: Status = 'failed_quality', max attempts logged

## Test 4: Compliance Validation (GDPR + PCI-DSS)
Workflow with sensitive data and compliance requirements.

Expected: Compliance check passes, standards listed in output

## Test 5: Quality Disabled, Safety Enabled
Test independent operation of safety without quality.

Expected: Safety checks run, no quality validation

## Test 6: Safety Disabled, Quality Enabled
Test independent operation of quality without safety.

Expected: Quality checks run, no safety validation

## Test 7: Both Disabled
Verify backwards compatibility when features disabled.

Expected: Normal workflow execution, no quality/safety metadata

## Test 8: Edge Case - Quality Threshold 1.0 (Impossible)
Set extremely high quality threshold.

Expected: Multiple reruns, eventually fail_quality

## Test 9: Edge Case - Zero Rerun Attempts
Set max_rerun_attempts to 0.

Expected: No rerun even if quality fails

## Test 10: Complex Workflow with All Features
Multi-node workflow with full quality/safety integration.

Expected: All 5 auto-injected nodes, full validation pipeline



