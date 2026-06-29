const http = require('http');

function post(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);
    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseBody));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${responseBody}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function runVerification() {
  console.log('=== Backend Verification ===\n');
  try {
    // 1. Verify Low Block matches
    console.log('1. Checking matches for "low_block"...');
    const lowBlockMatches = await get('http://localhost:3001/api/tactical/historical/concepts/low_block');
    console.log(`   Found ${lowBlockMatches.length} matches for low_block:`);
    lowBlockMatches.forEach(m => console.log(`   - ID: ${m.example_id}, Match: ${m.match_name}`));
    if (lowBlockMatches.length === 3) {
      console.log('   ✅ PASS');
    } else {
      console.log('   ❌ FAIL: Expected 3 matches');
    }

    // 2. Verify Defensive Block matches
    console.log('\n2. Checking matches for "defensive_block"...');
    const defensiveBlockMatches = await get('http://localhost:3001/api/tactical/historical/concepts/defensive_block');
    console.log(`   Found ${defensiveBlockMatches.length} matches for defensive_block:`);
    defensiveBlockMatches.forEach(m => console.log(`   - ID: ${m.example_id}, Match: ${m.match_name}`));
    if (defensiveBlockMatches.length === 2) {
      console.log('   ✅ PASS');
    } else {
      console.log('   ❌ FAIL: Expected 2 matches');
    }

    // 3. Verify Translation Endpoint
    console.log('\n3. Testing POST /api/tactical/translate to Spanish...');
    const testPayload = {
      texts: [
        "Welcome to Football Atlas! I'm your AI tactical tutor powered by IBM Granite. Ask me questions like 'Why is a False 9 hard to defend?' or 'How does a high press work?' to begin!",
        "Why is False 9 hard to defend?"
      ],
      targetLang: 'es'
    };
    const esResponse = await post('http://localhost:3001/api/tactical/translate', testPayload);
    console.log('   Translated texts:', esResponse.translatedTexts);
    if (esResponse.translatedTexts && esResponse.translatedTexts.length === 2) {
      console.log('   ✅ PASS');
    } else {
      console.log('   ❌ FAIL');
    }

  } catch (err) {
    console.error('❌ Error during verification:', err);
  }
}

runVerification();
