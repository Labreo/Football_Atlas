import { documentIngestionService } from './services/ingestion.service';
import { knowledgeRetrievalService } from './services/retrieval.service';
import { knowledgeStore } from './services/store.service';
import { tacticalRegistry } from '@football-atlas/shared';

async function runSeedIngestionDemo() {
  console.log('\n================================================================');
  console.log('⚽ FOOTBALL ATLAS KNOWLEDGE INGESTION & RETRIEVAL DEMONSTRATION');
  console.log('================================================================\n');

  // Clear store to ensure clean slate
  knowledgeStore.clear();

  // 1. Prepare simulated tactical article content (Markdown)
  const articleContent = `
# The False 9 and Midfield Overloads under Guardiola
Author: Sanjay Waradkar
Source: Football Atlas Tactical In-Depth
Published: 2024

In modern positional play, occupying the half-spaces and manipulating defensive structures is paramount. Under Pep Guardiola, the False 9 became the ultimate spatial weapon. 

# Section 1: The Striker Dropping Deep
By deploying Lionel Messi centrally but instructing him to drop deep into midfield, Barcelona turned standard 3v3 midfield battles into a 4v3 midfield overload. 
The central defenders of Real Madrid were faced with a dilemma: step up to follow the False 9 and leave massive wide channels, or stay flat and allow Messi time to turn and play passing lanes.
This numerical superiority allowed clean progression through central corridors.

# Section 2: Inverted Wingers and Exploitation
As Messi dropped to receive, inverted wingers Thierry Henry and Samuel Eto'o made diagonal runs from out to in, penetrating the space vacated by the center-backs. 
This third man run pattern was triggered instantly when the center-back stepped forward. The movement forced defenders to track runs horizontally, breaking the defensive line.

# Section 3: High Press Counter-Measures
Defenders attempting to counter the False 9 often attempt to compress space with a high press, compressing the lines to prevent the midfield overload. 
However, if the team in possession has strong compactness, quick vertical passing can bypass the pressing triggers and release inverted wingers into space behind.
`;

  const file = {
    buffer: Buffer.from(articleContent, 'utf-8'),
    originalname: 'tactical_analysis_guardiola.md',
    mimetype: 'text/markdown'
  };

  const metadata = {
    title: 'The False 9 and Midfield Overloads under Guardiola',
    source: 'Football Atlas Tactical In-Depth',
    author: 'Sanjay Waradkar',
    publication_year: 2024
  };

  console.log('📥 1. Ingesting tactical document...');
  console.log(`   - Filename: ${file.originalname}`);
  console.log(`   - Title: "${metadata.title}"`);
  console.log(`   - Author: ${metadata.author}`);
  
  const docRecord = await documentIngestionService.ingestDocument(file, metadata);
  
  console.log('\n✅ Document Ingestion Successful!');
  console.log(`   - Document ID: ${docRecord.document_id}`);
  console.log(`   - Status: ${docRecord.metadata.processing_status}`);
  console.log(`   - Chunks Generated: ${docRecord.chunk_ids.length}`);
  console.log(`   - Processing Time: ${docRecord.processing_time_ms}ms`);
  console.log();

  // 2. Print individual chunk breakdowns
  console.log('📄 2. Printing chunk analysis details:');
  const chunks = knowledgeRetrievalService.getDocumentChunks(docRecord.document_id);
  chunks.forEach((chunk, i) => {
    console.log(`   ------------------------------------------------------------`);
    console.log(`   [Chunk ${i + 1}] ID: ${chunk.chunk_id}`);
    console.log(`   - Section: "${chunk.section_title}" (Page ${chunk.page_number})`);
    console.log(`   - Word Count: ${chunk.word_count} words`);
    console.log(`   - Detected Tactical Tags: ${JSON.stringify(chunk.concept_tags)}`);
    console.log(`   - Content Preview: "${chunk.content.substring(0, 120)}..."`);
  });
  console.log();

  // 3. Demonstrate retrieval queries
  console.log('🔍 3. Testing retrieval queries...');

  // Search by keyword
  console.log('\n   A. Keyword Search: "Messi"');
  const messiHits = knowledgeRetrievalService.searchByKeyword('Messi');
  console.log(`      Found ${messiHits.length} chunk(s) matching "Messi":`);
  messiHits.forEach((hit) => {
    console.log(`      * [ID: ${hit.chunk_id}] Section: "${hit.section_title}"`);
  });

  // Search by keyword
  console.log('\n   B. Keyword Search: "press"');
  const pressHits = knowledgeRetrievalService.searchByKeyword('press');
  console.log(`      Found ${pressHits.length} chunk(s) matching "press":`);
  pressHits.forEach((hit) => {
    console.log(`      * [ID: ${hit.chunk_id}] Section: "${hit.section_title}" - Tags: ${JSON.stringify(hit.concept_tags)}`);
  });

  // Retrieve chunks by Concept ID
  console.log('\n   C. Concept-linked Chunk Search: "false_9"');
  const false9Chunks = knowledgeRetrievalService.getChunksForConcept('false_9');
  console.log(`      Found ${false9Chunks.length} chunk(s) linked to "false_9":`);
  false9Chunks.forEach((c) => {
    console.log(`      * [ID: ${c.chunk_id}] Preview: "${c.content.substring(0, 90)}..."`);
  });

  // Related knowledge retrieval
  if (chunks.length > 0) {
    const targetChunkId = chunks[0].chunk_id;
    console.log(`\n   D. Related Knowledge recommendation (relative score sorting) for: ${targetChunkId}`);
    const related = knowledgeRetrievalService.getRelatedKnowledge(targetChunkId);
    console.log(`      Found ${related.length} related chunk(s) sharing concept tags:`);
    related.forEach((r) => {
      console.log(`      * [ID: ${r.chunk_id}] Section: "${r.section_title}" - Tags: ${JSON.stringify(r.concept_tags)}`);
    });
  }

  // 4. Verify Bidirectional Concept Registry Linkage
  console.log('\n🔗 4. Verifying Bidirectional Concept Registry Linkage (Concept -> Chunk)');
  const false9Concept = tacticalRegistry.getConcept('false_9');
  if (false9Concept) {
    console.log(`   ✅ Success! Retrieved False 9 concept from shared registry:`);
    console.log(`      - Concept Name: ${false9Concept.concept_name}`);
    console.log(`      - Linked Docling Chunks in Registry:`);
    false9Concept.docling_chunks.forEach((ref) => {
      console.log(`        * Chunk ID: ${ref.chunk_id} | Source: "${ref.source_document}" | Score: ${ref.relevance_score}%`);
    });
  } else {
    console.log('   ❌ Error: False 9 concept not found in Concept Registry.');
  }

  console.log('\n================================================================');
  console.log('⚽ END OF FOOTBALL ATLAS KNOWLEDGE INGESTION DEMONSTRATION');
  console.log('================================================================\n');
}

runSeedIngestionDemo().catch((err) => {
  console.error('❌ Ingestion demonstration failed:', err);
});
