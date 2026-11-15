/*
================================================
Project Name : SeedShare Garden
Student Name : T. Yashwanth
Roll Number  : 252U1R3092
Contribution : Database Module (database.js)
================================================
*/

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite database file
const dbPath = path.resolve(__dirname, 'seedshare.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database: seedshare.db');
  }
});

// Setup tables and sample seed data sequentially
db.serialize(() => {
  // 1. Enable foreign key support in SQLite
  db.run('PRAGMA foreign_keys = ON;');

  // ==========================================
  // GARDEN PLOTS SYSTEM (SeedShare Garden)
  // ==========================================

  // Table: gardeners
  db.run(`
    CREATE TABLE IF NOT EXISTS gardeners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL
    )
  `);

  // Table: plots (with name and soil)
  db.run(`
    CREATE TABLE IF NOT EXISTS plots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      soil TEXT NOT NULL
    )
  `);

  // Table: leases (relates gardeners and plots)
  db.run(`
    CREATE TABLE IF NOT EXISTS leases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gardener_id INTEGER NOT NULL,
      plot_id INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      FOREIGN KEY (gardener_id) REFERENCES gardeners(id) ON DELETE CASCADE,
      FOREIGN KEY (plot_id) REFERENCES plots(id) ON DELETE CASCADE
    )
  `);

  // Seed gardeners
  db.run("INSERT OR IGNORE INTO gardeners (id, name, email) VALUES (1, 'Alice Green', 'alice@seedshare.org')");
  db.run("INSERT OR IGNORE INTO gardeners (id, name, email) VALUES (2, 'Bob Brown', 'bob@seedshare.org')");
  db.run("INSERT OR IGNORE INTO gardeners (id, name, email) VALUES (3, 'Charlie Smith', 'charlie@seedshare.org')");

  // Seed plots
  db.run("INSERT OR IGNORE INTO plots (id, name, soil) VALUES (1, 'North Patch', 'Loam')");
  db.run("INSERT OR IGNORE INTO plots (id, name, soil) VALUES (2, 'South Field', 'Clay')");
  db.run("INSERT OR IGNORE INTO plots (id, name, soil) VALUES (3, 'East Meadow', 'Sandy')");
  db.run("INSERT OR IGNORE INTO plots (id, name, soil) VALUES (4, 'West Orchard', 'Silt')");
  db.run("INSERT OR IGNORE INTO plots (id, name, soil) VALUES (5, 'Sunken Bed', 'Loam')");
  db.run("INSERT OR IGNORE INTO plots (id, name, soil) VALUES (6, 'Hilltop Terrace', 'Clay')");

  // Seed leases
  db.run("INSERT OR IGNORE INTO leases (id, gardener_id, plot_id, start_date, end_date) VALUES (1, 1, 1, '2026-03-01', '2026-09-30')");
  db.run("INSERT OR IGNORE INTO leases (id, gardener_id, plot_id, start_date, end_date) VALUES (2, 2, 2, '2026-04-01', '2026-10-31')");
});

module.exports = db;
