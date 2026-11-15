/*
================================================
Project Name : SeedShare Garden
Student Name : K. NAGASAI 
Roll Number  : 252U1R3064
Contribution : Backend Server & REST API Routes (server.js)
================================================
*/

const express = require('express');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON bodies
app.use(express.json());

// Logger middleware to see incoming requests in terminal
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ==========================================
// 1. HOME ROUTE
// ==========================================
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to SeedShare Garden API',
    endpoints: {
      getAllPlots: 'GET /plots?page=1&limit=5',
      searchBySoil: 'GET /plots?soil=Loam',
      getPlotById: 'GET /plots/:id',
      createPlot: 'POST /plots (body: { name, soil })',
      updatePlot: 'PUT /plots/:id (body: { name, soil })',
      deletePlot: 'DELETE /plots/:id',
      getLeases: 'GET /leases (Joins gardener and plot information)'
    }
  });
});

// =========================================================================
// 2. SEEDSHARE GARDEN PLOTS API
// =========================================================================

// GET /plots - Pagination (Twist) & Search by Soil
app.get('/plots', (req, res) => {
  let { page, limit, soil } = req.query;

  const pageNum = page !== undefined ? parseInt(page, 10) : 1;
  const limitNum = limit !== undefined ? parseInt(limit, 10) : 5;

  if (isNaN(pageNum) || pageNum <= 0) {
    return res.status(400).json({ error: 'Invalid page number: page must be an integer greater than 0' });
  }

  if (isNaN(limitNum) || limitNum < 0) {
    return res.status(400).json({ error: 'Invalid limit: limit cannot be negative' });
  }

  const offset = (pageNum - 1) * limitNum;
  let countSql = 'SELECT COUNT(*) AS total FROM plots';
  let dataSql = 'SELECT * FROM plots';
  const queryParams = [];

  if (soil && soil.trim() !== '') {
    countSql += ' WHERE LOWER(soil) LIKE LOWER(?)';
    dataSql += ' WHERE LOWER(soil) LIKE LOWER(?)';
    queryParams.push(`%${soil.trim()}%`);
  }

  db.get(countSql, queryParams, (err, countRow) => {
    if (err) return res.status(500).json({ error: err.message });
    const total = countRow.total;

    dataSql += ' ORDER BY id ASC LIMIT ? OFFSET ?';
    db.all(dataSql, [...queryParams, limitNum, offset], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({
        total: total,
        page: pageNum,
        limit: limitNum,
        data: rows
      });
    });
  });
});

// GET /plots/:id - Get a single plot
app.get('/plots/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM plots WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: `Plot with ID ${id} not found` });
    res.status(200).json(row);
  });
});

// POST /plots - Create a new plot
app.post('/plots', (req, res) => {
  const { name, soil } = req.body;
  if (!name || !soil || !name.trim() || !soil.trim()) {
    return res.status(400).json({ error: "Validation error: 'name' and 'soil' are required" });
  }
  db.run('INSERT INTO plots (name, soil) VALUES (?, ?)', [name.trim(), soil.trim()], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Plot added successfully', plot: { id: this.lastID, name: name.trim(), soil: soil.trim() } });
  });
});

// PUT /plots/:id - Update an existing plot
app.put('/plots/:id', (req, res) => {
  const { id } = req.params;
  const { name, soil } = req.body;
  if (!name || !soil || !name.trim() || !soil.trim()) {
    return res.status(400).json({ error: "Validation error: 'name' and 'soil' are required" });
  }
  db.get('SELECT * FROM plots WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: `Plot with ID ${id} not found` });
    db.run('UPDATE plots SET name = ?, soil = ? WHERE id = ?', [name.trim(), soil.trim(), id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ message: 'Plot updated successfully', plot: { id: parseInt(id, 10), name: name.trim(), soil: soil.trim() } });
    });
  });
});

// DELETE /plots/:id - Delete a plot
app.delete('/plots/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM plots WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: `Plot with ID ${id} deleted successfully` });
  });
});

// GET /leases - JOIN endpoint for gardeners and plots
app.get('/leases', (req, res) => {
  const sql = `
    SELECT 
      leases.id AS lease_id, leases.start_date, leases.end_date,
      gardeners.name AS gardener_name,
      plots.name AS plot_name, plots.soil AS plot_soil
    FROM leases
    JOIN gardeners ON leases.gardener_id = gardeners.id
    JOIN plots ON leases.plot_id = plots.id
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ count: rows.length, leases: rows });
  });
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(` 🚀 SeedShare Garden API running on port ${PORT}`);
    console.log(` Home API:   http://localhost:${PORT}/`);
    console.log(` Plots API:  http://localhost:${PORT}/plots`);
    console.log(` Leases API: http://localhost:${PORT}/leases`);
    console.log(`===============================================`);
  });
}

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

module.exports = app;

