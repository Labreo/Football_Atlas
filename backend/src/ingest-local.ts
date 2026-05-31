import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const doclingPath = '/Users/sanjaywaradkar/miniforge3/bin/docling';
const docsDir = '/Users/sanjaywaradkar/Football_Atlas/football_atlas_docling';
const serverUrl = 'http://localhost:3001/documents/upload';

async function ingestLocalDocs() {
  console.log('\n====================================================');
  console.log('⚽ FOOTBALL ATLAS LOCAL INGESTION MANAGER');
  console.log('====================================================\n');

  if (!fs.existsSync(docsDir)) {
    console.error(`❌ Error: Directory not found: ${docsDir}`);
    return;
  }

  const files = fs.readdirSync(docsDir);
  const mdFiles = files.filter((f) => f.toLowerCase().endsWith('.md') && !f.toLowerCase().endsWith('_clean.md'));

  console.log(`Found ${mdFiles.length} Markdown documents in "${docsDir}".\n`);

  for (const mdFile of mdFiles) {
    const baseName = path.basename(mdFile, path.extname(mdFile));
    const cleanMdPath = path.join(docsDir, `${baseName}_clean.md`);
    const defaultMdPath = path.join(docsDir, mdFile);
    const mdFilePath = fs.existsSync(cleanMdPath) ? cleanMdPath : defaultMdPath;

    console.log(`Processing: "${mdFile}"`);

    // Upload to Live Backend Server using Curl
    console.log(`   📤 Uploading converted Markdown to Football Atlas server...`);
    try {
      const cleanTitle = baseName.replace(/[-_]/g, ' ');
      const publicationYear = mdFile.includes('2024') ? 2024 : 2023; // Default
      let author = 'Football Atlas';
      if (mdFile.toLowerCase().includes('dfb')) {
        author = 'Deutscher Fußball-Bund (DFB)';
      } else if (mdFile.toLowerCase().includes('edf')) {
        author = 'EDF Leitfaden';
      } else if (mdFile.toLowerCase().includes('sahasrabudhe')) {
        author = 'Sahasrabudhe & Bekkers';
      } else if (mdFile.toLowerCase().includes('ffa')) {
        author = 'Football Federation Australia (FFA)';
      }

      const curlCmd = `curl -s -X POST \
        -F "file=@${mdFilePath}" \
        -F "title=${cleanTitle}" \
        -F "source=football_atlas_docling" \
        -F "author=${author}" \
        -F "publication_year=${publicationYear}" \
        "${serverUrl}"`;

      const response = execSync(curlCmd).toString();
      
      try {
        const resJson = JSON.parse(response);
        if (resJson.error) {
          console.error(`   ❌ Server returned error: ${resJson.message}`);
        } else {
          console.log(`   ✅ Ingestion successful! Document ID: ${resJson.document_id}`);
          console.log(`      - Chunks indexed: ${resJson.chunk_ids.length}`);
          console.log(`      - Language detected: ${resJson.metadata.language}`);
          console.log(`      - Tactical concepts: ${JSON.stringify(resJson.detected_concepts || [])}`);
        }
      } catch (parseErr) {
        console.error(`   ❌ Server returned raw output (non-JSON): ${response.substring(0, 200)}...`);
      }
    } catch (err: any) {
      console.error(`   ❌ Failed to upload document: ${err.message}`);
    }
    console.log();
  }

  console.log('====================================================');
  console.log('⚽ ALL PROCESSING AND INGESTION RUNS COMPLETE');
  console.log('====================================================\n');
}

ingestLocalDocs();
