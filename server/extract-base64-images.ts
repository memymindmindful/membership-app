/**
 * Migration Utility: Extract embedded base64 images from db.json to physical files in data/uploads/
 * Replaces base64 strings with lightweight /uploads/<filename> URLs.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const JSON_DB_FILE = path.join(DATA_DIR, 'db.json');
const BACKUP_FILE = path.join(DATA_DIR, 'db.json.backup-before-image-extraction');

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function extractImagesRecursive(
  obj: any,
  uploadsDir: string,
  stats: { count: number; totalBytesSaved: number; sampleLocations: string[] },
  currentPath = ''
): any {
  if (typeof obj === 'string' && obj.startsWith('data:image/')) {
    const matches = obj.match(/^data:image\/([\w\+\-\.]+);base64,(.+)$/);
    if (matches) {
      const rawExt = matches[1].toLowerCase();
      let ext = rawExt;
      if (rawExt === 'jpeg') ext = 'jpg';
      else if (rawExt === 'svg+xml') ext = 'svg';

      const buffer = Buffer.from(matches[2], 'base64');
      const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
      const filePath = path.join(uploadsDir, uniqueName);

      fs.writeFileSync(filePath, buffer);
      stats.count++;
      stats.totalBytesSaved += buffer.length;
      if (stats.sampleLocations.length < 10) {
        stats.sampleLocations.push(`${currentPath} -> /uploads/${uniqueName} (${formatBytes(buffer.length)})`);
      }
      return `/uploads/${uniqueName}`;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item, index) =>
      extractImagesRecursive(item, uploadsDir, stats, `${currentPath}[${index}]`)
    );
  }

  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      const nextPath = currentPath ? `${currentPath}.${key}` : key;
      result[key] = extractImagesRecursive(obj[key], uploadsDir, stats, nextPath);
    }
    return result;
  }

  return obj;
}

function runExtraction() {
  console.log('==================================================');
  console.log('Extracting Base64 Images from data/db.json');
  console.log('==================================================');

  if (!fs.existsSync(JSON_DB_FILE)) {
    console.error(`Error: Source JSON file not found at ${JSON_DB_FILE}`);
    process.exit(1);
  }

  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log(`Created uploads directory at: ${UPLOADS_DIR}`);
  }

  const rawContent = fs.readFileSync(JSON_DB_FILE, 'utf-8');
  const initialSizeBytes = Buffer.byteLength(rawContent, 'utf-8');
  console.log(`Current data/db.json size: ${formatBytes(initialSizeBytes)} (${initialSizeBytes.toLocaleString()} bytes)`);

  // Create safety backup
  console.log(`Creating safety backup: ${BACKUP_FILE}`);
  fs.writeFileSync(BACKUP_FILE, rawContent, 'utf-8');
  console.log('Backup created successfully.');

  let dbData: any;
  try {
    dbData = JSON.parse(rawContent);
  } catch (err: any) {
    console.error(`Failed to parse data/db.json: ${err.message}`);
    process.exit(1);
  }

  const stats = {
    count: 0,
    totalBytesSaved: 0,
    sampleLocations: [] as string[],
  };

  console.log('Scanning and extracting embedded base64 images...');
  const cleanedData = extractImagesRecursive(dbData, UPLOADS_DIR, stats);

  if (stats.count === 0) {
    console.log('No embedded base64 images found in data/db.json.');
    console.log('All image references are already external URLs or /uploads/ paths.');
    return;
  }

  // Write updated lean json back to db.json
  console.log(`Writing cleaned database back to: ${JSON_DB_FILE}`);
  const updatedContent = JSON.stringify(cleanedData, null, 2);
  fs.writeFileSync(JSON_DB_FILE, updatedContent, 'utf-8');

  const finalSizeBytes = Buffer.byteLength(updatedContent, 'utf-8');
  const savedBytes = initialSizeBytes - finalSizeBytes;
  const reductionPercent = ((savedBytes / initialSizeBytes) * 100).toFixed(1);

  console.log('\n==================================================');
  console.log('Extraction Completed Successfully!');
  console.log('==================================================');
  console.log(`- Images extracted:         ${stats.count}`);
  console.log(`- Total binary data saved:  ${formatBytes(stats.totalBytesSaved)}`);
  console.log(`- File size before:         ${formatBytes(initialSizeBytes)}`);
  console.log(`- File size after:          ${formatBytes(finalSizeBytes)}`);
  console.log(`- Total size reduction:     ${formatBytes(savedBytes)} (-${reductionPercent}%)`);
  console.log(`- Files saved in:           ${UPLOADS_DIR}`);
  console.log(`- Backup file stored at:    ${BACKUP_FILE}`);
  console.log('--------------------------------------------------');

  if (stats.sampleLocations.length > 0) {
    console.log('Sample extracted images:');
    stats.sampleLocations.forEach((loc) => console.log(`  * ${loc}`));
  }
  console.log('==================================================\n');
}

runExtraction();
