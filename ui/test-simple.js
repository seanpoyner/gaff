/**
 * Simple test for running GAFF adapter
 */

console.log('\n' + '='.repeat(70));
console.log('🧪 Testing GAFF OpenAI Adapter');
console.log('='.repeat(70) + '\n');

const testQuery = 'Analyze customer satisfaction scores from the last quarter';

console.log(`📝 Query: "${testQuery}"\n`);
console.log('⏳ Sending request...\n');

const response = await fetch('http://localhost:3100/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer dummy-key-not-used'
  },
  body: JSON.stringify({
    model: 'gaff-gateway',
    messages: [
      { role: 'user', content: testQuery }
    ]
  })
});

console.log(`📊 HTTP Status: ${response.status} ${response.statusText}\n`);

if (!response.ok) {
  console.error('❌ Request failed:', await response.text());
  process.exit(1);
}

const result = await response.json();

console.log('✅ Response received!\n');
console.log('=' + '='.repeat(69));
console.log('📋 RESPONSE DATA');
console.log('=' + '='.repeat(69) + '\n');
console.log(JSON.stringify(result, null, 2));

const content = result.choices?.[0]?.message?.content;

if (content) {
  console.log('\n' + '='.repeat(70));
  console.log('💬 CONTENT');
  console.log('='.repeat(70) + '\n');
  
  try {
    const parsed = JSON.parse(content);
    console.log(JSON.stringify(parsed, null, 2));
    
    console.log('\n' + '='.repeat(70));
    console.log('🔍 VALIDATION');
    console.log('='.repeat(70) + '\n');
    
    // Check key fields
    const checks = [
      ['Status', parsed.status, (v) => v === 'completed' || v === 'success' || v === 'error'],
      ['Orchestration Card', parsed.orchestration_card, (v) => v !== undefined],
      ['Intent Graph', parsed.intent_graph, (v) => v !== undefined],
      ['Execution ID', parsed.execution_id, (v) => typeof v === 'string'],
      ['Memory Key', parsed.memory_key, (v) => v !== undefined && v !== 'undefined']
    ];
    
    let allPassed = true;
    for (const [name, value, check] of checks) {
      const passed = check(value);
      const symbol = passed ? '✅' : '❌';
      console.log(`${symbol} ${name}: ${JSON.stringify(value)}`);
      if (!passed) allPassed = false;
    }
    
    console.log('\n' + '='.repeat(70));
    if (allPassed) {
      console.log('🎉 ALL CHECKS PASSED!');
    } else {
      console.log('⚠️  SOME CHECKS FAILED');
    }
    console.log('='.repeat(70) + '\n');
    
    process.exit(allPassed ? 0 : 1);
    
  } catch (e) {
    console.log('⚠️  Content is not JSON:');
    console.log(content);
    console.log('\n❌ Expected JSON response');
    process.exit(1);
  }
} else {
  console.log('\n❌ No content in response');
  process.exit(1);
}


