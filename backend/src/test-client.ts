import { Logger } from './utils/logger';

async function runTest() {
  const url = 'http://localhost:3001/api/granite/test';
  const payload = {
    question: 'Why is a False 9 hard to defend?'
  };

  Logger.info('Test Client: Initializing POST query to local Express server...', {
    target_url: url,
    payload
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Express server returned error status ${response.status} (${response.statusText})`);
    }

    const bodyJson = await response.json();
    
    console.log('\n======================================================');
    console.log('⚽ FOOTBALL ATLAS AI TUTOR TEST RUN SUCCESS');
    console.log('======================================================');
    console.log(JSON.stringify(bodyJson, null, 2));
    console.log('======================================================\n');

  } catch (err: any) {
    Logger.error('Test Client run aborted due to exception', err);
    process.exit(1);
  }
}

runTest();
