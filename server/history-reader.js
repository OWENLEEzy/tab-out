// server/history-reader.js
// ─────────────────────────────────────────────────────────────────────────────
// Reads Chrome's local SQLite browsing history database.
//
// Why does this need a temp copy?
//   Chrome keeps its history in a SQLite file at:
//     ~/Library/Application Support/Google/Chrome/Default/History
//   While Chrome is running, it holds an exclusive lock on that file.
//   If we tried to open the original, SQLite would throw a "database is locked"
//   error. The fix: copy the file to a temp location first, then read the copy.
//   Chrome doesn't lock the copy, so we can read it freely.
//
// Why are Chrome timestamps weird?
//   Chrome stores timestamps as microseconds since January 1, 1601.
//   Unix timestamps are seconds since January 1, 1970.
//   The difference between those two dates is exactly 11,644,473,600 seconds.
//   So to convert: subtract that offset (in microseconds), then divide by 1M.
// ─────────────────────────────────────────────────────────────────────────────

const fs     = require('fs');
const path   = require('path');
const os     = require('os');

// better-sqlite3 is a synchronous SQLite library — it reads the whole result
// synchronously rather than using callbacks. For a local file read this is
// perfectly fine and much simpler than async SQLite drivers.
const Database = require('better-sqlite3');

// Our config module — exports the config object directly.
// config.historyDays  → how far back to look (default 7)
// config.batchSize    → target entries per AI batch (we query 2x this)
const config = require('./config');

// ─── Paths ────────────────────────────────────────────────────────────────────

// Where Chrome stores its history on macOS.
const CHROME_HISTORY_PATH = path.join(
  os.homedir(),
  'Library', 'Application Support', 'Google', 'Chrome', 'Default', 'History'
);

// Where we copy it to before reading (avoids Chrome's file lock).
const TEMP_COPY_PATH = path.join(os.tmpdir(), 'mission-control-history-copy.db');

// ─── Timestamp helpers ────────────────────────────────────────────────────────

// Number of seconds between Jan 1 1601 (Chrome epoch) and Jan 1 1970 (Unix epoch).
const CHROME_EPOCH_OFFSET_SECONDS = 11644473600;

/**
 * chromeMicrosToDate(chromeMicros)
 *
 * Converts a Chrome timestamp (microseconds since 1601-01-01) to a JS Date.
 *
 * Example: 13,000,000,000,000,000 µs → some date in 2012
 */
function chromeMicrosToDate(chromeMicros) {
  // Step 1: Convert microseconds → seconds
  const chromeSecs = chromeMicros / 1_000_000;
  // Step 2: Subtract Chrome's epoch offset to get Unix seconds
  const unixSecs = chromeSecs - CHROME_EPOCH_OFFSET_SECONDS;
  // Step 3: JS Date expects milliseconds
  return new Date(unixSecs * 1000);
}

/**
 * formatDate(date)
 *
 * Returns a readable datetime string like "2024-03-15 14:30:00"
 * in local time. Easier to read than ISO 8601 strings.
 */
function formatDate(date) {
  // toLocaleString with 'sv-SE' locale gives "YYYY-MM-DD HH:MM:SS" format —
  // clean and sortable without importing a date library.
  return date.toLocaleString('sv-SE', {
    year:   'numeric',
    month:  '2-digit',
    day:    '2-digit',
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).replace('T', ' ');
}

// ─── Main exported function ───────────────────────────────────────────────────

/**
 * readRecentHistory()
 *
 * Reads Chrome's history SQLite database and returns an array of recent URLs.
 *
 * Each returned object has:
 *   url            — the full URL string
 *   title          — the page title (may be empty string)
 *   visit_count    — how many times Chrome has visited this URL
 *   last_visit     — formatted datetime string, e.g. "2024-03-15 14:30:00"
 *   last_visit_raw — raw Chrome microsecond timestamp (used for sorting/dedup)
 *
 * Returns an empty array and logs a warning if the history file doesn't exist
 * or can't be read. Does NOT throw — the caller should handle empty gracefully.
 */
function readRecentHistory() {
  // ── 1. Confirm the Chrome history file exists ─────────────────────────────
  if (!fs.existsSync(CHROME_HISTORY_PATH)) {
    console.warn(`[history-reader] Chrome history not found at: ${CHROME_HISTORY_PATH}`);
    console.warn('[history-reader] Is Chrome installed? Have you browsed with it?');
    return [];
  }

  // ── 2. Copy the history file to a temp path ───────────────────────────────
  // This sidesteps Chrome's file lock.
  try {
    fs.copyFileSync(CHROME_HISTORY_PATH, TEMP_COPY_PATH);
  } catch (err) {
    console.error(`[history-reader] Failed to copy history file: ${err.message}`);
    return [];
  }

  let db = null;

  try {
    // ── 3. Open the copy in read-only mode ──────────────────────────────────
    // readonly: true prevents accidental writes. fileMustExist: true causes an
    // error (rather than creating a new file) if the copy somehow vanished.
    db = new Database(TEMP_COPY_PATH, { readonly: true, fileMustExist: true });

    // ── 4. Calculate the cutoff timestamp ──────────────────────────────────
    // config.historyDays days ago, expressed as Chrome microseconds.
    const cutoffDate    = new Date(Date.now() - config.historyDays * 24 * 60 * 60 * 1000);
    const cutoffUnixSec = cutoffDate.getTime() / 1000;
    // Convert back to Chrome epoch microseconds
    const cutoffChronoMicros = (cutoffUnixSec + CHROME_EPOCH_OFFSET_SECONDS) * 1_000_000;

    // ── 5. Determine query limit ─────────────────────────────────────────────
    // We fetch 2x the batch size so the filter + deduplicate steps still have
    // plenty to work with after removing noise.
    const queryLimit = config.batchSize * 2;

    // ── 6. Query Chrome's urls table ─────────────────────────────────────────
    // Chrome's history database has two main tables:
    //   urls       — one row per unique URL, with title and visit count
    //   visits     — one row per actual visit (many per URL)
    //
    // We only need the urls table here since it already has last_visit_time
    // (the most recent visit to each URL).
    //
    // ORDER BY last_visit_time DESC gives us newest first.
    // LIMIT keeps the query fast.
    const rows = db.prepare(`
      SELECT
        url,
        title,
        visit_count,
        last_visit_time
      FROM urls
      WHERE last_visit_time > ?
      ORDER BY last_visit_time DESC
      LIMIT ?
    `).all(cutoffChronoMicros, queryLimit);

    // ── 7. Transform raw rows into our clean output format ───────────────────
    const entries = rows.map(row => {
      const visitDate = chromeMicrosToDate(row.last_visit_time);
      return {
        url:            row.url   || '',
        title:          row.title || '',
        visit_count:    row.visit_count || 0,
        last_visit:     formatDate(visitDate),   // human-readable string
        last_visit_raw: row.last_visit_time,     // raw microseconds, for dedup sorting
      };
    });

    return entries;

  } catch (err) {
    console.error(`[history-reader] Error reading history database: ${err.message}`);
    return [];

  } finally {
    // ── 8. Always clean up ───────────────────────────────────────────────────
    // Close the database connection first, then delete the temp file.
    // "finally" runs whether we succeeded or hit an error.
    if (db) {
      try { db.close(); } catch { /* ignore close errors */ }
    }
    try {
      fs.unlinkSync(TEMP_COPY_PATH);
    } catch {
      // If cleanup fails (e.g. file already gone), it's not worth crashing over.
    }
  }
}

module.exports = { readRecentHistory };
