// test_api.js - Automated Test Script for SeedShare Garden API
// Run with: node test_api.js

const http = require('http');
const app = require('./server');

const TEST_PORT = 3000;

// Helper to make HTTP requests
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) { json = data; }
        resolve({ status: res.statusCode, data: json });
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n======================================================');
  console.log(' 🌱 RUNNING SEEDSHARE GARDEN API TESTS');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, detail = '') {
    total++;
    if (condition) {
      console.log(` ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(` ❌ FAIL: ${testName}`);
      if (detail) console.error(`    Detail: ${JSON.stringify(detail)}`);
    }
  }

  // --- TWIST TESTS (REQUIRED IN BRIEF) ---
  console.log('--- 1. TWIST TESTS (Pagination & Validations) ---');

  // Test 1: ?page=1&limit=2 -> 200, 2 plots
  const t1 = await request('GET', '/plots?page=1&limit=2');
  assert(
    t1.status === 200 && Array.isArray(t1.data.data) && t1.data.data.length === 2 && t1.data.page === 1,
    'Test 1: ?page=1&limit=2 returns 200 with 2 plots',
    t1
  );

  // Test 2: ?page=2&limit=2 -> 200, next 2 plots
  const t2 = await request('GET', '/plots?page=2&limit=2');
  const differentPlots = t1.data.data[0]?.id !== t2.data.data[0]?.id;
  assert(
    t2.status === 200 && Array.isArray(t2.data.data) && t2.data.data.length === 2 && t2.data.page === 2 && differentPlots,
    'Test 2: ?page=2&limit=2 returns 200 with next 2 plots',
    t2
  );

  // Test 3: ?page=0 -> 400 Bad Request
  const t3 = await request('GET', '/plots?page=0');
  assert(
    t3.status === 400 && t3.data.error,
    'Test 3: ?page=0 returns 400 Bad Request',
    t3
  );

  // Test 4: ?limit=-5 -> 400 Bad Request
  const t4 = await request('GET', '/plots?limit=-5');
  assert(
    t4.status === 400 && t4.data.error,
    'Test 4: Negative limit returns 400 Bad Request',
    t4
  );

  // --- SEARCH TESTS ---
  console.log('\n--- 2. SEARCH BY QUERY PARAMETER (?soil=) ---');
  const searchLoam = await request('GET', '/plots?soil=Loam');
  const allLoam = searchLoam.data.data && searchLoam.data.data.every(p => p.soil.toLowerCase().includes('loam'));
  assert(
    searchLoam.status === 200 && allLoam && searchLoam.data.data.length > 0,
    'Search by ?soil=Loam returns only Loam plots',
    searchLoam.data
  );

  // --- JOIN ENDPOINT ---
  console.log('\n--- 3. JOIN ENDPOINT (Leases with Gardener & Plot names) ---');
  const leases = await request('GET', '/leases');
  const hasGardenerAndPlot = leases.data.leases && leases.data.leases.every(l => l.gardener_name && l.plot_name);
  assert(
    leases.status === 200 && hasGardenerAndPlot && leases.data.leases.length > 0,
    'GET /leases returns joined gardener_name, plot_name, and plot_soil',
    leases.data.leases?.[0]
  );

  // --- CRUD ON PLOTS ---
  console.log('\n--- 4. PLOTS CRUD ENDPOINTS ---');

  // Add plot
  const addPlot = await request('POST', '/plots', { name: 'Willow Corner', soil: 'Clay' });
  const newPlotId = addPlot.data.plot?.id;
  assert(
    addPlot.status === 201 && newPlotId,
    'POST /plots adds a plot with status 201',
    addPlot
  );

  // Validation failure on add
  const addInvalid = await request('POST', '/plots', { name: 'No Soil Plot' });
  assert(
    addInvalid.status === 400 && addInvalid.data.error,
    'POST /plots fails with 400 when soil is missing',
    addInvalid
  );

  // Get one plot
  const getOne = await request('GET', `/plots/${newPlotId}`);
  assert(
    getOne.status === 200 && getOne.data.name === 'Willow Corner',
    'GET /plots/:id fetches single plot with 200',
    getOne
  );

  // Update plot
  const updatePlot = await request('PUT', `/plots/${newPlotId}`, { name: 'Willow Corner Updated', soil: 'Enriched Loam' });
  assert(
    updatePlot.status === 200 && updatePlot.data.plot.name === 'Willow Corner Updated',
    'PUT /plots/:id updates plot with 200',
    updatePlot
  );

  // Delete plot
  const deletePlot = await request('DELETE', `/plots/${newPlotId}`);
  assert(
    deletePlot.status === 200,
    'DELETE /plots/:id deletes plot with 200',
    deletePlot
  );

  console.log('\n======================================================');
  console.log(` 🎯 TEST SUMMARY: ${passed}/${total} TESTS PASSED!`);
  console.log('======================================================\n');

  if (passed !== total) {
    throw new Error(`${total - passed} tests failed`);
  }
}

// Start server and run tests
const server = app.listen(TEST_PORT, '127.0.0.1', async () => {
  try {
    await runTests();
    server.close(() => {
      process.exit(0);
    });
  } catch (err) {
    console.error('Test execution error:', err);
    server.close(() => {
      process.exit(1);
    });
  }
});
