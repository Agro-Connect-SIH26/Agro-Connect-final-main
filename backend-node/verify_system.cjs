/**
 * Comprehensive System Verification Script
 * Read-only inventory and health checks
 */
const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('./src/config');

const MARKET_PRICE_STATES = ['Uttar Pradesh', 'Punjab', 'West Bengal', 'Haryana', 'Maharashtra', 'Odisha', 'Madhya Pradesh', 'Gujarat', 'Bihar', 'Karnataka'];
const MARKET_PRICE_CROPS = ['Onion', 'Tomato', 'Potato', 'Green Chilli'];

async function run() {
  console.log('='.repeat(60));
  console.log('AGROCONNECT SYSTEM VERIFICATION');
  console.log('='.repeat(60));

  // Connect to MongoDB
  const mongoUri = config.mongoUri || 'mongodb://127.0.0.1:27017/agroconnect';
  await mongoose.connect(mongoUri);
  console.log('\n[OK] MongoDB Connected:', mongoUri);

  const db = mongoose.connection.db;

  // 1. DATABASE INVENTORY
  console.log('\n' + '='.repeat(60));
  console.log('1. MONGODB DATABASE INVENTORY');
  console.log('='.repeat(60));

  const collections = await db.listCollections().toArray();
  console.log('\nCollections:');
  for (const c of collections) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`  - ${c.name}: ${count.toLocaleString()} documents`);
  }

  // MarketPrices specific analysis
  console.log('\n--- MarketPrices Detailed Analysis ---');
  const mpColl = db.collection('marketprices');
  const mpTotal = await mpColl.countDocuments();
  console.log(`Total marketprices: ${mpTotal.toLocaleString()}`);

  // Sources
  const sources = await mpColl.aggregate([
    { $group: { _id: '$source', count: { $sum: 1 } } }
  ]).toArray();
  console.log('\nBy source:');
  for (const s of sources) {
    console.log(`  - ${s._id}: ${s.count.toLocaleString()}`);
  }

  // isLive
  const liveCounts = await mpColl.aggregate([
    { $group: { _id: '$isLive', count: { $sum: 1 } } }
  ]).toArray();
  console.log('\nBy isLive:');
  for (const l of liveCounts) {
    console.log(`  - ${l._id}: ${l.count.toLocaleString()}`);
  }

  // Distinct values
  const distinctCrops = await mpColl.distinct('cropName');
  const distinctStates = await mpColl.distinct('state');
  console.log(`\nDistinct crops: ${distinctCrops.length}`);
  console.log(`Distinct states: ${distinctStates.length}`);

  // Date range
  const dateRange = await mpColl.aggregate([
    { $group: {
      _id: null,
      earliest: { $min: '$priceDate' },
      latest: { $max: '$priceDate' }
    }}
  ]).toArray();
  if (dateRange.length > 0) {
    console.log(`\nDate range: ${dateRange[0].earliest} to ${dateRange[0].latest}`);
  }

  // 2. HISTORICAL DATA COVERAGE
  console.log('\n' + '='.repeat(60));
  console.log('2. HISTORICAL DATA COVERAGE');
  console.log('='.repeat(60));

  console.log('\nCrop/State combination counts:');
  console.log('Crop'.padEnd(15) + 'State'.padEnd(18) + 'Count'.padEnd(12) + 'Earliest'.padEnd(12) + 'Latest');
  console.log('-'.repeat(70));

  for (const crop of MARKET_PRICE_CROPS) {
    for (const state of MARKET_PRICE_STATES) {
      const result = await mpColl.aggregate([
        { $match: { cropName: crop, state: state } },
        { $group: {
          _id: null,
          count: { $sum: 1 },
          earliest: { $min: '$priceDate' },
          latest: { $max: '$priceDate' }
        }}
      ]).toArray();

      if (result.length > 0) {
        console.log(
          crop.padEnd(15) +
          state.padEnd(18) +
          result[0].count.toString().padEnd(12) +
          (result[0].earliest || 'N/A').padEnd(12) +
          (result[0].latest || 'N/A')
        );
      } else {
        console.log(crop.padEnd(15) + state.padEnd(18) + '0');
      }
    }
  }

  // 3. AGMARKNET DATA FILES
  console.log('\n' + '='.repeat(60));
  console.log('3. AGMARKNET DATA FILES');
  console.log('='.repeat(60));

  const dataFiles = [
    'data/agmarknet_p5_small.json',
    'data/agmarknet_validation_real.json',
    'data/market_prices.csv',
    'src/data/agmarknet_filters.json'
  ];

  for (const f of dataFiles) {
    const fullPath = path.join(__dirname, '..', f);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      console.log(`\n[EXISTS] ${f}`);
      console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);

      if (f.endsWith('.json')) {
        try {
          const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          if (Array.isArray(content)) {
            console.log(`  Records: ${content.length}`);
          } else if (content.records) {
            console.log(`  Records: ${content.records.length}`);
          } else {
            console.log(`  Keys: ${Object.keys(content).slice(0, 10).join(', ')}`);
          }
        } catch (e) {
          console.log(`  Parse error: ${e.message}`);
        }
      } else if (f.endsWith('.csv')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n').filter(l => l.trim());
        console.log(`  Lines: ${lines.length}`);
      }
    } else {
      console.log(`\n[MISSING] ${f}`);
    }
  }

  // Check for backfill files
  const dataDir = path.join(__dirname, '..', 'data');
  if (fs.existsSync(dataDir)) {
    const files = fs.readdirSync(dataDir);
    const backfillFiles = files.filter(f => f.startsWith('backfill_2y'));
    if (backfillFiles.length > 0) {
      console.log('\nBackfill files found:');
      for (const f of backfillFiles) {
        const stats = fs.statSync(path.join(dataDir, f));
        console.log(`  - ${f} (${(stats.size / 1024).toFixed(2)} KB)`);
      }
    }
  }

  // 4. ML MODEL INVENTORY
  console.log('\n' + '='.repeat(60));
  console.log('4. ML MODEL INVENTORY');
  console.log('='.repeat(60));

  const mlModelsDir = path.join(__dirname, '..', 'ml', 'models');
  if (fs.existsSync(mlModelsDir)) {
    const modelFiles = fs.readdirSync(mlModelsDir);
    console.log(`\nModel files: ${modelFiles.length}`);
    for (const f of modelFiles) {
      const stats = fs.statSync(path.join(mlModelsDir, f));
      console.log(`  - ${f} (${(stats.size / 1024).toFixed(2)} KB)`);
    }

    // Check metadata
    const metaPath = path.join(mlModelsDir, 'metadata.json');
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      console.log('\nMetadata:');
      console.log(JSON.stringify(meta, null, 2));
    }
  } else {
    console.log('\n[ERROR] ml/models directory not found');
  }

  await mongoose.disconnect();
  console.log('\n[OK] MongoDB Disconnected');
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});