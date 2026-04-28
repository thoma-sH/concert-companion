// SQLite-backed drop-in for the previous mysql2/promise pool.
// Exposes execute() / query() that return [rows, fields] so existing
// `const [rows] = await pool.execute(sql, params)` callers keep working.

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = path.join(process.cwd(), "concert_companion.sqlite");
const SCHEMA_PATH = path.join(process.cwd(), "app", "api", "lib", "schema.sqlite.sql");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Apply schema (CREATE TABLE IF NOT EXISTS, idempotent)
try {
  const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
  db.exec(schema);
} catch (err) {
  console.error("[db] failed to apply SQLite schema:", err);
}

// Translate MySQL idioms used in the codebase to their SQLite equivalents
function translate(sql) {
  return sql
    .replace(/\bNOW\(\)/gi, "CURRENT_TIMESTAMP")
    .replace(/\bINSERT\s+IGNORE\b/gi, "INSERT OR IGNORE");
}

function run(sql, params = []) {
  const stmt = db.prepare(translate(sql));
  // SELECT statements use .all(), everything else uses .run()
  const isSelect = /^\s*(select|with|pragma)\b/i.test(sql);
  if (isSelect) {
    const rows = stmt.all(...params);
    return [rows, []];
  }
  const info = stmt.run(...params);
  // mysql2 returns OkPacket-ish; we expose insertId/affectedRows for parity
  return [{ insertId: info.lastInsertRowid, affectedRows: info.changes }, []];
}

const pool = {
  async execute(sql, params = []) { return run(sql, params); },
  async query(sql, params = [])   { return run(sql, params); },
  // raw escape hatch for tests/debug
  _db: db,
};

export default pool;
