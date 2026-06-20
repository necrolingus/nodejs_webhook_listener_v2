import { DatabaseSync } from 'node:sqlite';
import { dirname } from 'path';
import { mkdirSync } from 'fs';
import { config } from '../config/index.js';

// Ensure DB directory exists
const dbFile = config.db.file;
mkdirSync(dirname(dbFile), { recursive: true });

const db = new DatabaseSync(dbFile, {
  timeout: 5000, // 5 seconds busy timeout
});

// Enable WAL mode and foreign keys
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

function parseJsonColumns(row) {
  if (!row) return row;
  const jsonColumns = ['headers', 'cookies', 'query_params', 'body'];
  for (const col of jsonColumns) {
    if (col in row && typeof row[col] === 'string') {
      try {
        row[col] = JSON.parse(row[col]);
      } catch (err) {
        // Fallback if parsing fails
      }
    }
  }
  return row;
}

export function querySync(text, params = []) {
  // Convert Postgres $1, $2, ... placeholders to ?
  const sqliteSql = text.replace(/\$\d+/g, '?');

  // Map parameters (e.g. Dates to ISO string format)
  const mappedParams = params.map(param => {
    if (param instanceof Date) {
      return param.toISOString();
    }
    return param;
  });

  // Handle multi-statement queries (like migration files)
  const statements = sqliteSql
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);

  if (statements.length > 1) {
    try {
      db.exec(sqliteSql);
      return {
        rows: [],
        rowCount: 0,
      };
    } catch (err) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        err.message = `duplicate key value violates unique constraint: ${err.message}`;
      }
      throw err;
    }
  }

  const stmt = db.prepare(sqliteSql);

  // If the query contains SELECT or RETURNING, run it as a retrieval query
  const upperSql = text.toUpperCase();
  if (upperSql.includes('SELECT') || upperSql.includes('RETURNING')) {
    try {
      const rawRows = stmt.all(...mappedParams);
      const rows = rawRows.map(parseJsonColumns);
      return {
        rows,
        rowCount: rows.length,
      };
    } catch (err) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        err.message = `duplicate key value violates unique constraint: ${err.message}`;
      }
      throw err;
    }
  } else {
    try {
      const info = stmt.run(...mappedParams);
      return {
        rows: [],
        rowCount: info.changes,
      };
    } catch (err) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        err.message = `duplicate key value violates unique constraint: ${err.message}`;
      }
      throw err;
    }
  }
}

export async function query(text, params = []) {
  return querySync(text, params);
}

export async function getClient() {
  // SQLite doesn't need pools, return a helper that matches PG client
  return {
    query: async (text, params = []) => querySync(text, params),
    release: () => {},
  };
}

// For compatibility with tests calling pool.end()
export const pool = {
  end: async () => {
    try {
      db.close();
    } catch (err) {
      // Ignored if already closed
    }
  },
};
