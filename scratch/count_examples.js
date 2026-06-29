const fs = require('fs');
const path = require('path');

const examplesPath = path.join(__dirname, '../backend/data/historical_examples.json');
const examples = JSON.parse(fs.readFileSync(examplesPath, 'utf8'));

const counts = {};
examples.forEach(ex => {
  counts[ex.concept_id] = (counts[ex.concept_id] || 0) + 1;
});

console.log('Historical Examples counts by concept_id:');
console.log(JSON.stringify(counts, null, 2));
