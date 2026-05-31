import { documentIngestionService } from './services/ingestion.service';
import { knowledgeRetrievalService } from './services/retrieval.service';
import { knowledgeStore } from './services/store.service';
import { tacticalRegistry } from '@football-atlas/shared';

async function runMultilingualTests() {
  console.log('\n================================================================');
  console.log('⚽ FOOTBALL ATLAS MULTILINGUAL RETRIEVAL QUALITY TESTS');
  console.log('================================================================\n');

  // 0. Reset stores
  knowledgeStore.clear();

  // --- INGEST DOCUMENTS ---

  // A. German document
  const deDoc = {
    buffer: Buffer.from(
      `# Die Entwicklung des modernen Fußballs\n` +
      `Die falsche neun ist ein genialer Taktikzug von Pep Guardiola. Wenn der Stürmer sich abkippen lässt, entsteht eine Mittelfeldüberzahl.\n\n` +
      `# Das Gegenpressing\n` +
      `Klopps Gegenpressing ist weltberühmt. Die Spieler laufen sofort an, sobald der Ball verloren geht, um Umschaltmomente zu nutzen.`,
      'utf-8'
    ),
    originalname: 'guardiola_klopp_de.md',
    mimetype: 'text/markdown'
  };
  const deMeta = {
    title: 'Guardiola und Klopp: Falsche Neun und Gegenpressing',
    source: 'Deutscher Fußball Bund',
    author: 'Hansi Flick',
    publication_year: 2023
  };

  // B. Spanish document
  const esDoc = {
    buffer: Buffer.from(
      `# La Revolución del Falso Nueve\n` +
      `El falso nueve de Leo Messi desarticuló a las defensas rivales. El delantero centro baja a recibir y crea superioridad numérica en mediocampo.`,
      'utf-8'
    ),
    originalname: 'cruyff_guardiola_es.md',
    mimetype: 'text/markdown'
  };
  const esMeta = {
    title: 'El Legado de Cruyff y el Falso Nueve',
    source: 'Revista de Táctica',
    author: 'Xavi Hernandez',
    publication_year: 2022
  };

  // C. English document
  const enDoc = {
    buffer: Buffer.from(
      `# Defensive Triggers\n` +
      `We set up a compact low block and wait for pressing triggers. This forms a pressing trap against the touchline to win possession.`,
      'utf-8'
    ),
    originalname: 'mourinho_defensive_en.md',
    mimetype: 'text/markdown'
  };
  const enMeta = {
    title: 'Mourinho Defensive Structures',
    source: 'Chelsea Academy Notes',
    author: 'John Terry',
    publication_year: 2021
  };

  console.log('📥 Ingesting multilingual files...');
  const deRecord = await documentIngestionService.ingestDocument(deDoc, deMeta);
  const esRecord = await documentIngestionService.ingestDocument(esDoc, esMeta);
  const enRecord = await documentIngestionService.ingestDocument(enDoc, enMeta);

  console.log('\n✅ Ingestion complete. Records registered in database:');
  console.log(`   - [DE] ID: ${deRecord.document_id} | Language: ${deRecord.metadata.language}`);
  console.log(`   - [ES] ID: ${esRecord.document_id} | Language: ${esRecord.metadata.language}`);
  console.log(`   - [EN] ID: ${enRecord.document_id} | Language: ${enRecord.metadata.language}`);
  console.log();

  // --- QUALITY TESTS ---

  let testPassed = 0;
  let testCount = 5;

  // TEST 1: German chunk containing "falsche neun" maps to false_9
  console.log('🧪 TEST 1: German chunk containing "falsche neun" maps to false_9');
  const deChunks = knowledgeRetrievalService.getDocumentChunks(deRecord.document_id);
  const f9DeChunk = deChunks.find(c => c.content.includes('falsche neun'));
  if (f9DeChunk && f9DeChunk.concept_tags.includes('false_9') && f9DeChunk.language === 'de') {
    console.log('   ✅ PASS: German text correctly identified as "de" and tagged with "false_9".');
    testPassed++;
  } else {
    console.log('   ❌ FAIL: German False 9 chunk not correctly tagged or language misidentified.');
  }
  console.log();

  // TEST 2: German chunk containing "Gegenpressing" maps to high_press
  console.log('🧪 TEST 2: German chunk containing "Gegenpressing" maps to high_press');
  const pressDeChunk = deChunks.find(c => c.content.includes('Gegenpressing'));
  if (pressDeChunk && pressDeChunk.concept_tags.includes('high_press') && pressDeChunk.language === 'de') {
    console.log('   ✅ PASS: Gegenpressing correctly classified as "high_press".');
    testPassed++;
  } else {
    console.log('   ❌ FAIL: Gegenpressing chunk not correctly tagged.');
  }
  console.log();

  // TEST 3: Spanish chunk containing "falso nueve" maps to false_9
  console.log('🧪 TEST 3: Spanish chunk containing "falso nueve" maps to false_9');
  const esChunks = knowledgeRetrievalService.getDocumentChunks(esRecord.document_id);
  const f9EsChunk = esChunks.find(c => c.content.includes('falso nueve'));
  if (f9EsChunk && f9EsChunk.concept_tags.includes('false_9') && f9EsChunk.language === 'es') {
    console.log('   ✅ PASS: Spanish text correctly identified as "es" and tagged with "false_9".');
    testPassed++;
  } else {
    console.log('   ❌ FAIL: Spanish Falso Nueve chunk not correctly tagged.');
  }
  console.log();

  // TEST 4: English query retrieves German/Spanish tactical chunks
  console.log('🧪 TEST 4: English query "Why is a False 9 difficult to defend?" retrieves German/Spanish tactical chunks');
  const query = 'Why is a False 9 difficult to defend?';
  const hits = knowledgeRetrievalService.searchByKeyword(query);
  const hasDeHit = hits.some(h => h.document_id === deRecord.document_id);
  const hasEsHit = hits.some(h => h.document_id === esRecord.document_id);
  
  if (hasDeHit && hasEsHit) {
    console.log(`   ✅ PASS: English query resolved concept and retrieved cross-lingual matches:`);
    hits.forEach(h => {
      console.log(`      * [Lang: ${h.language}] Chunk: "${h.content.substring(0, 100)}..."`);
    });
    testPassed++;
  } else {
    console.log('   ❌ FAIL: Cross-lingual lookup failed to find German or Spanish chunks.');
  }
  console.log();

  // TEST 5: Existing English functionality remains unchanged
  console.log('🧪 TEST 5: Existing English functionality remains unchanged');
  const enQuery = 'pressing trap';
  const enHits = knowledgeRetrievalService.searchByKeyword(enQuery);
  const matchesEnOnly = enHits.every(h => h.language === 'en');
  if (enHits.length > 0 && matchesEnOnly) {
    console.log('   ✅ PASS: English query successfully matched English documents without interference.');
    console.log(`      * Matches found: ${enHits.length}`);
    testPassed++;
  } else {
    console.log('   ❌ FAIL: English query returned incorrect results or no matches.');
  }
  console.log();

  // --- RESULTS ---
  console.log('================================================================');
  console.log(`📊 FINAL QUALITY TEST RESULTS: ${testPassed}/${testCount} PASSED`);
  if (testPassed === testCount) {
    console.log('🏆 STATUS: ALL SYSTEM VALIDATION CHECKS SUCCESSFUL!');
  } else {
    console.log('⚠️ STATUS: VALIDATION FAILURE DETECTED.');
  }
  console.log('================================================================\n');
}

runMultilingualTests().catch((err) => {
  console.error('❌ Multilingual tests execution failed:', err);
});
