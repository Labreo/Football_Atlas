const fs = require('fs');
const path = require('path');

const examplesFile = path.resolve(process.cwd(), 'backend/data/historical_examples.json');
const seedFile = path.resolve(process.cwd(), 'shared/src/seed/tactical.seed.ts');

if (!fs.existsSync(examplesFile)) {
  console.error('Examples file does not exist at:', examplesFile);
  process.exit(1);
}
if (!fs.existsSync(seedFile)) {
  console.error('Seed file does not exist at:', seedFile);
  process.exit(1);
}

const examples = JSON.parse(fs.readFileSync(examplesFile, 'utf8'));
const examplesByConcept = {};
examples.forEach(ex => {
  examplesByConcept[ex.concept_id] = (examplesByConcept[ex.concept_id] || 0) + 1;
});

const seedContent = fs.readFileSync(seedFile, 'utf8');
const conceptIdRegex = /concept_id:\s*'([^']+)'/g;
let match;
const allConceptIds = new Set();
while ((match = conceptIdRegex.exec(seedContent)) !== null) {
  allConceptIds.add(match[1]);
}

console.log('Concepts with matches count:');
const emptyConcepts = [];
allConceptIds.forEach(id => {
  const count = examplesByConcept[id] || 0;
  console.log(`- ${id}: ${count} matches`);
  if (count === 0) {
    emptyConcepts.push(id);
  }
});

console.log('\nEmpty Concepts:', emptyConcepts);
