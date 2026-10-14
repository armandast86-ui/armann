import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { query, waitForDatabase } from './db.js';

const here = dirname(fileURLToPath(import.meta.url));

export async function migrate() {
  const sql = await readFile(join(here, 'schema.sql'), 'utf8');
  await query(sql);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await waitForDatabase();
  await migrate();
  console.log('[migrate] schema is up to date');
  process.exit(0);
}
