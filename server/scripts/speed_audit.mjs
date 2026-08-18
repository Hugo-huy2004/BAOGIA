import fetch from 'node-fetch';

const BASE_URL = process.env.API_URL || 'http://localhost:8099/api';

console.log('=== SYSTEM SPEED & PERFORMANCE BENCHMARK ===\n');

async function measureEndpoint(name, path) {
  const start = performance.now();
  try {
    const res = await fetch(`${BASE_URL}${path}`);
    const duration = (performance.now() - start).toFixed(2);
    const size = res.headers.get('content-length') || 'N/A';
    const cache = res.headers.get('cache-control') || 'none';
    console.log(`⚡ [${res.status}] ${name} (${path})`);
    console.log(`   - Latency: ${duration} ms | Cache-Control: ${cache} | Size: ${size} bytes`);
    return { name, duration: parseFloat(duration), status: res.status };
  } catch (err) {
    const duration = (performance.now() - start).toFixed(2);
    console.log(`❌ [FAILED] ${name} (${path}) -> ${err.message} (${duration} ms)`);
    return { name, duration: parseFloat(duration), status: 0 };
  }
}

async function runBenchmark() {
  console.log('--- PUBLIC API LATENCY TEST ---');
  await measureEndpoint('Health Check / Security', '/checkin');
  await measureEndpoint('Public Bio Bloom Filter (Invalid Slug)', '/bio/slug/non-existent-random-slug-999999');
  await measureEndpoint('VietQR Bank Apps Catalogue', '/payos/bank-apps?platform=ios');
  await measureEndpoint('Cinema Movies Catalogue', '/cinema/movies');

  console.log('\n--- MEMORY & EV-LOOP HEALTH ---');
  const mem = process.memoryUsage();
  console.log(`- RSS Memory: ${(mem.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`- Heap Used: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB / ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`- External: ${(mem.external / 1024 / 1024).toFixed(2)} MB`);

  console.log('\n=== BENCHMARK COMPLETED ===');
}

runBenchmark().catch(console.error);
