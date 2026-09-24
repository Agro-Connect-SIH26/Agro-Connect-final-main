'use strict';

const http = require('http');

function req(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let text = '';
        res.on('data', (chunk) => (text += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: text ? JSON.parse(text) : {} });
          } catch (e) {
            resolve({ status: res.statusCode, body: text });
          }
        });
      }
    );
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function run() {
  console.log('Testing Service Provider & Request APIs...');

  // 1. Seed demo providers
  const seedRes = await req('POST', '/api/service-providers/seed-demo');
  console.log('Seed providers status:', seedRes.status, seedRes.body);

  // 2. List service providers
  const listRes = await req('GET', '/api/service-providers');
  console.log('List providers count:', listRes.body.total);
  if (!listRes.body.results || listRes.body.results.length === 0) {
    throw new Error('No providers found');
  }
  const provider = listRes.body.results[0];
  console.log('Using provider:', provider.name, provider.public_id, provider.service_type);

  // 3. Create service request
  const createReq = await req('POST', '/api/service-requests', {
    farmer_user_public_id: 'USR-TESTFARMER',
    farmer_name: 'Ramesh Kumar',
    farmer_contact: '9876543210',
    provider_public_id: provider.public_id,
    service_type: provider.service_type,
    crop_name: 'Tomato',
    crop_variety: 'Hybrid',
    quantity: 1200,
    quantity_unit: 'kg',
    pickup_location: 'Nashik Farm',
    destination: 'Mumbai APMC',
    estimated_cost: 3500,
    notes: 'Urgent transport needed for fresh harvest',
  });
  console.log('Create service request status:', createReq.status, createReq.body.public_id);
  const srId = createReq.body.public_id;

  // 4. Get service request
  const getReq = await req('GET', `/api/service-requests/${srId}`);
  console.log('Get service request status:', getReq.body.status, getReq.body.crop_name);

  // 5. Accept service request with quote
  const acceptReq = await req('PATCH', `/api/service-requests/${srId}/status`, {
    status: 'ACCEPTED',
    provider_quote: 3400,
    notes: 'Confirmed pickup tomorrow at 8 AM',
  });
  console.log('Accept status:', acceptReq.body.status, 'Quote:', acceptReq.body.provider_quote);

  // 6. Complete service request
  const completeReq = await req('PATCH', `/api/service-requests/${srId}/status`, {
    status: 'COMPLETED',
  });
  console.log('Complete status:', completeReq.body.status);

  console.log('All Service Provider tests passed successfully! âœ…');
}

run().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});
