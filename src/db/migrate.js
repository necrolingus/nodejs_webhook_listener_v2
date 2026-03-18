import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { query } from './pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function migrate() {
  const schemaPath = join(__dirname, 'schema.sql');
  const sql = await readFile(schemaPath, 'utf-8');
  await query(sql);
  console.log('Database migration completed');
}

// Allow running directly: node src/db/migrate.js
if (process.argv[1] && process.argv[1].includes('migrate.js')) {
  migrate()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
