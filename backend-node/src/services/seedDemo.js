/**
 * services/seedDemo.js — idempotent demo data seeding.
 *
 * Used on startup (if RUN_SEED_ON_STARTUP=true and DB is empty) and
 * also exposed via the /api/buyers/seed-demo, /api/fpos/seed-demo
 * endpoints so the UI can populate a fresh DB on demand.
 *
 * Idempotency: every seeder checks the count first; if rows already
 * exist, it returns { inserted: 0, skipped: N } and never duplicates.
 */
'use strict';

const Buyer = require('../models/Buyer');
const FPO = require('../models/FPO');
const CropLot = require('../models/CropLot');
const MarketPrice = require('../models/MarketPrice');
const User = require('../models/User');
const Demand = require('../models/Demand');
const ServiceProvider = require('../models/ServiceProvider');
const Offer = require('../models/Offer');
const Deal = require('../models/Deal');
const { BuyerId, SPId, CropLotId, OfferId, DealId } = require('../utils/publicId');
const { UserId } = require('../utils/randomUserId');

const DEMO_BUYERS = [
  {
    name: 'Ranchi Fresh Organics',
    location: 'Ranchi',
    state: 'Jharkhand',
    contact: '+91 9876543210',
    requirements: [
      { cropName: 'Tomato', minQuantityKg: 500, maxPricePerKg: 28, preferredStates: ['Jharkhand', 'Bihar'] },
    ],
  },
  {
    name: 'FreshHarvest Traders',
    location: 'Patna',
    state: 'Bihar',
    contact: '+91 9876501234',
    requirements: [
      { cropName: 'Tomato', minQuantityKg: 1000, maxPricePerKg: 26, preferredStates: ['Bihar', 'Jharkhand'] },
      { cropName: 'Onion', minQuantityKg: 2000, maxPricePerKg: 32, preferredStates: ['Bihar', 'Maharashtra'] },
    ],
  },
  {
    name: 'SpiceRoute Mandi',
    location: 'Indore',
    state: 'Madhya Pradesh',
    contact: '+91 9988776655',
    requirements: [
      { cropName: 'Chilli', minQuantityKg: 800, maxPricePerKg: 215, preferredStates: ['Madhya Pradesh'] },
    ],
  },
  {
    name: 'Punjab Agro Co-op',
    location: 'Amritsar',
    state: 'Punjab',
    contact: '+91 9123456789',
    requirements: [
      { cropName: 'Wheat', minQuantityKg: 4000, maxPricePerKg: 34, preferredStates: ['Punjab', 'Haryana'] },
    ],
  },
];

const DEMO_FPOS = [
  { name: 'Patna Kisan FPO', location: 'Patna', district: 'Patna', state: 'Bihar', contact: '+91 9000000001' },
  { name: 'Nalanda Organic FPO', location: 'Nalanda', district: 'Nalanda', state: 'Bihar', contact: '+91 9000000002' },
];

/**
 * Demo accounts surfaced on the Login page. These are *prototype*
 * accounts, not real auth — passwords are stored in plain text in
 * MongoDB. The login page banner makes that clear.
 *
 * The role determines the default landing page after login:
 *   - SELLER  → /farmer   (FarmerDashboard)
 *   - BUYER   → /buyer    (BuyerDashboard)
 *   - FPO     → /fpos     (FPO list; FPO member view)
 */
const DEMO_USERS = [
  {
    email: 'farmer@agroconnect.demo',
    password: 'farmer123',
    role: 'SELLER',
    displayName: 'Demo Farmer',
  },
  {
    email: 'buyer@agroconnect.demo',
    password: 'buyer123',
    role: 'BUYER',
    displayName: 'Demo Buyer',
  },
  {
    email: 'fpofarmer@agroconnect.demo',
    password: 'farmer123',
    role: 'FPO',
    displayName: 'Demo FPO Farmer',
  },
  {
    email: 'transporter@agroconnect.demo',
    password: 'transporter123',
    role: 'SERVICE_PROVIDER',
    displayName: 'Demo Transporter',
  },
  {
    email: 'coldstorage@agroconnect.demo',
    password: 'coldstorage123',
    role: 'SERVICE_PROVIDER',
    displayName: 'Demo Cold Storage',
  }
];

const DEMO_SERVICE_PROVIDERS = [
  {
    name: 'Jalgaon Agri-Transporters',
    serviceType: 'TRANSPORT',
    type: 'Logistics',
    description: 'Expertise in primary transport (20FT/40FT), local loading support.',
    contact: '98765 43210',
    location: 'Jalgaon',
    district: 'Jalgaon',
    state: 'Maharashtra',
    tags: ['Primary', 'Local', '20FT', 'Demo'],
    vehicleTypes: ['20FT', '40FT'],
    rateDescription: 'Rate: Approx ₹35/km (ref)',
    ratePerKm: 35,
    email: 'transporter@agroconnect.demo',
  },
  {
    name: 'Maharashtra Cold Chain Co.',
    serviceType: 'COLD_STORAGE',
    type: 'Cold Storage',
    description: 'NHB-certified cold storage facilities, temperature-monitored.',
    contact: '98765 12345',
    location: 'Nashik',
    district: 'Nashik',
    state: 'Maharashtra',
    tags: ['NHB Approved', '24/7 Power', 'Demo'],
    capacity: '500 MT',
    rateDescription: 'Rate: Approx ₹0.20/kg/day (ref)',
    ratePerKgPerDay: 0.20,
    isNHB: true,
    email: 'coldstorage@agroconnect.demo',
  }
];

const DEMO_MARKET_PRICES = [
  // INR/quintal (1 quintal = 100kg). demo provider.
  { cropName: 'Tomato', market: 'Patna Mandi', state: 'Bihar', district: 'Patna', pricePerQuintal: 2400, pricePerKg: 24, source: 'demo' },
  { cropName: 'Tomato', market: 'Bengaluru APMC', state: 'Karnataka', district: 'Bengaluru', pricePerQuintal: 2200, pricePerKg: 22, source: 'demo' },
  { cropName: 'Onion', market: 'Nashik APMC', state: 'Maharashtra', district: 'Nashik', pricePerQuintal: 2800, pricePerKg: 28, source: 'demo' },
  { cropName: 'Onion', market: 'Lasalgaon', state: 'Maharashtra', district: 'Nashik', pricePerQuintal: 3000, pricePerKg: 30, source: 'demo' },
  { cropName: 'Potato', market: 'Agra Mandi', state: 'Uttar Pradesh', district: 'Agra', pricePerQuintal: 1800, pricePerKg: 18, source: 'demo' },
  { cropName: 'Wheat', market: 'Amritsar Mandi', state: 'Punjab', district: 'Amritsar', pricePerQuintal: 3100, pricePerKg: 31, source: 'demo' },
  { cropName: 'Rice', market: 'Karnal Mandi', state: 'Haryana', district: 'Karnal', pricePerQuintal: 3700, pricePerKg: 37, source: 'demo' },
  { cropName: 'Maize', market: 'Davangere', state: 'Karnataka', district: 'Davangere', pricePerQuintal: 2600, pricePerKg: 26, source: 'demo' },
  { cropName: 'Soybean', market: 'Indore Mandi', state: 'Madhya Pradesh', district: 'Indore', pricePerQuintal: 5300, pricePerKg: 53, source: 'demo' },
  { cropName: 'Cotton', market: 'Rajkot', state: 'Gujarat', district: 'Rajkot', pricePerQuintal: 7200, pricePerKg: 72, source: 'demo' },
  { cropName: 'Groundnut', market: 'Junagadh', state: 'Gujarat', district: 'Junagadh', pricePerQuintal: 7900, pricePerKg: 79, source: 'demo' },
  { cropName: 'Chilli', market: 'Guntur', state: 'Andhra Pradesh', district: 'Guntur', pricePerQuintal: 19500, pricePerKg: 195, source: 'demo' },
];

async function seedDemoBuyers() {
  const existing = await Buyer.countDocuments({});
  if (existing > 0) {
    const activeDemands = await Demand.countDocuments({ status: 'ACTIVE' });
    if (activeDemands === 0) {
      const demoBuyers = await Buyer.find({ isDemo: true });
      for (const b of demoBuyers) {
        for (const r of b.requirements || []) {
          await Demand.create({
            publicId: Demand.newPublicId(),
            buyerId: b._id,
            buyerPublicId: b.publicId,
            cropName: r.cropName,
            cropVariety: r.cropVariety || '',
            quantityKg: r.minQuantityKg || 1000,
            maxPricePerKg: r.maxPricePerKg || null,
            location: r.location || b.location || '',
            state: (r.preferredStates && r.preferredStates[0]) || b.state || '',
            requiredDate: r.requiredDate || '',
            notes: r.notes || '',
            status: 'ACTIVE',
          });
        }
      }
    }
    return { inserted: 0, skipped: existing, total: existing };
  }
  const created = [];
  for (const d of DEMO_BUYERS) {
    const b = await Buyer.create({
      publicId: BuyerId(),
      name: d.name,
      location: d.location,
      state: d.state,
      contact: d.contact,
      isDemo: true,
      requirements: d.requirements,
    });
    for (const r of d.requirements || []) {
      await Demand.create({
        publicId: Demand.newPublicId(),
        buyerId: b._id,
        buyerPublicId: b.publicId,
        cropName: r.cropName,
        cropVariety: r.cropVariety || '',
        quantityKg: r.minQuantityKg || 1000,
        maxPricePerKg: r.maxPricePerKg || null,
        location: r.location || b.location || '',
        state: (r.preferredStates && r.preferredStates[0]) || b.state || '',
        status: 'ACTIVE',
      });
    }
    created.push(b.toRead());
  }
  return { inserted: created.length, skipped: 0, total: created.length, results: created };
}

async function seedDemoFPOs() {
  const existing = await FPO.countDocuments({});
  if (existing > 0) {
    return { inserted: 0, skipped: existing, total: existing };
  }
  const created = [];
  for (const d of DEMO_FPOS) {
    const f = await FPO.create({
      publicId: require('../utils/publicId').FPOId(),
      name: d.name,
      location: d.location,
      district: d.district,
      state: d.state,
      contact: d.contact,
      isDemo: true,
    });
    created.push(f.toRead());
  }
  return { inserted: created.length, skipped: 0, total: created.length, results: created };
}

async function seedDemoMarketPrices() {
  const existing = await MarketPrice.countDocuments({ source: 'demo' });
  if (existing > 0) {
    return { inserted: 0, skipped: existing, total: existing };
  }
  const created = await MarketPrice.insertMany(
    DEMO_MARKET_PRICES.map((d) => ({
      cropName: d.cropName,
      market: d.market,
      state: d.state,
      district: d.district,
      pricePerQuintal: d.pricePerQuintal,
      pricePerKg: d.pricePerKg,
      // Phase 3 — every demo row gets a priceDate so the
      // history/prediction aggregators have something to chew on.
      priceDate: '2026-08-29',
      arrivalDate: '2026-08-29',
      unit: 'INR/quintal',
      price_unit: 'INR/quintal',
      variety: '',
      grade: '',
      arrivals: null,
      source: 'demo',
      isLive: false,
    }))
  );
  return { inserted: created.length, skipped: 0, total: created.length };
}

async function seedDemoServiceProviders() {
  const existing = await ServiceProvider.countDocuments({ isDemo: true });
  if (existing > 0) {
    return { inserted: 0, skipped: existing, total: existing };
  }
  const created = [];
  for (const d of DEMO_SERVICE_PROVIDERS) {
    const sp = await ServiceProvider.create({
      publicId: SPId(),
      name: d.name,
      serviceType: d.serviceType,
      type: d.type,
      description: d.description,
      location: d.location,
      district: d.district,
      state: d.state,
      contact: d.contact,
      email: d.email,
      tags: d.tags,
      vehicleTypes: d.vehicleTypes,
      capacity: d.capacity,
      rateDescription: d.rateDescription,
      ratePerKm: d.ratePerKm,
      ratePerKgPerDay: d.ratePerKgPerDay,
      isNHB: d.isNHB,
      isDemo: true,
      verificationStatus: 'VERIFIED',
    });
    created.push(sp.toRead());
  }
  return { inserted: created.length, skipped: 0, total: created.length, results: created };
}

async function seedDemoUsers() {
  // Idempotent on email: if a user with the demo email already exists,
  // we don't insert a duplicate. We DO upsert the role/displayName so
  // re-seeding after a model change is safe, and migrate the plain
  // `password` field to a proper `passwordHash` for new installs.
  const created = [];
  const updated = [];
  for (const d of DEMO_USERS) {
    const existing = await User.findOne({ email: d.email });
    if (existing) {
      let dirty = false;
      if (existing.role !== d.role) { existing.role = d.role; dirty = true; }
      if (existing.displayName !== d.displayName) {
        existing.displayName = d.displayName; dirty = true;
      }
      if (!existing.isDemo) { existing.isDemo = true; dirty = true; }
      // If the existing user has no bcrypt hash yet (e.g. upgraded
      // from a pre-bcrypt install), set one from the demo password.
      if (!existing.passwordHash && !existing.password) {
        await existing.setPassword(d.password);
        dirty = true;
      }
      if (dirty) { await existing.save(); updated.push(existing.toRead()); }
      continue;
    }
    const u = new User({
      publicId: UserId(),
      role: d.role,
      displayName: d.displayName,
      email: d.email,
      isDemo: true,
    });

    if (d.role === 'SERVICE_PROVIDER') {
      const sp = await ServiceProvider.findOne({ email: d.email });
      if (sp) u.activeServiceProviderId = sp.publicId;
    }

    await u.setPassword(d.password);
    await u.save();
    created.push(u.toRead());
  }
  const total = await User.countDocuments({});
  return { inserted: created.length, updated: updated.length, total };
}

async function seedDemoFarmerStory() {
  const farmer = await User.findOne({ email: 'farmer@agroconnect.demo' });
  if (!farmer) return { error: 'Farmer not found' };

  // 1. Create 3 crop lots if not exist
  const lots = [
    {
      cropName: 'Tomato',
      cropVariety: 'Hybrid-Pusa',
      quantity: 500,
      quantityUnit: 'kg',
      state: 'Jharkhand',
      location: 'Ranchi',
      farmerQualityGrade: 'A',
      expectedPricePerKg: 30,
      minimumAcceptablePrice: 25,
      coldStorageRequired: false,
      notes: 'Harvested freshly, firm red tomatoes ready for immediate dispatch in Ranchi.',
    },
    {
      cropName: 'Onion',
      cropVariety: 'Garhwa Red',
      quantity: 1500,
      quantityUnit: 'kg',
      state: 'Maharashtra',
      location: 'Nashik',
      farmerQualityGrade: 'A',
      expectedPricePerKg: 28,
      minimumAcceptablePrice: 24,
      coldStorageRequired: true,
      coldStorageDurationDays: 15,
      notes: 'Cured and bagged, ready for storage or mandi dispatch.',
    },
    {
      cropName: 'Wheat',
      cropVariety: 'Sharbati',
      quantity: 3000,
      quantityUnit: 'kg',
      state: 'Punjab',
      location: 'Amritsar',
      farmerQualityGrade: 'B',
      expectedPricePerKg: 34,
      minimumAcceptablePrice: 30,
      coldStorageRequired: false,
      notes: 'Clean golden grain, moisture < 12%.',
    },
  ];

  for (const l of lots) {
    const existing = await CropLot.findOne({ cropName: l.cropName, sellerUserPublicId: farmer.publicId });
    if (!existing) {
      await CropLot.create({
        ...l,
        publicId: CropLot.newPublicId(),
        sellerUserPublicId: farmer.publicId,
        status: 'ACTIVE',
      });
    }
  }

  // 2. Active deal and offers
  const tomatoLot = await CropLot.findOne({ cropName: 'Tomato', sellerUserPublicId: farmer.publicId });
  const onionLot = await CropLot.findOne({ cropName: 'Onion', sellerUserPublicId: farmer.publicId });
  const ranchiBuyer = await Buyer.findOne({ name: 'Ranchi Fresh Organics' });
  const patnaBuyer = await Buyer.findOne({ name: 'FreshHarvest Traders' });

  if (tomatoLot && ranchiBuyer) {
    let existingDeal = await Deal.findOne({ cropLotId: tomatoLot._id });
    if (!existingDeal) {
      const offer = await Offer.create({
        publicId: OfferId(),
        cropLotId: tomatoLot._id,
        buyerId: ranchiBuyer._id,
        farmerUserPublicId: farmer.publicId,
        currentPrice: 28,
        currentQuantity: 500,
        status: 'ACCEPTED',
        decidedAt: new Date(),
        messages: [
          {
            author: 'BUYER',
            message: 'We can take your 500 kg Tomato lot at ₹28/kg with local pickup in Ranchi.',
            price: 28,
            quantity: 500,
            createdAt: new Date(Date.now() - 3600 * 1000 * 24),
          },
          {
            author: 'FARMER',
            message: 'Accepted. Will keep the crates ready for loading.',
            price: 28,
            quantity: 500,
            createdAt: new Date(Date.now() - 3600 * 1000 * 12),
          },
        ],
      });

      existingDeal = await Deal.create({
        publicId: DealId(),
        cropLotId: tomatoLot._id,
        buyerId: ranchiBuyer._id,
        farmerUserPublicId: farmer.publicId,
        offerId: offer._id,
        agreedPricePerKg: 28,
        agreedQuantity: 500,
        totalValue: 14000,
        amount: 14000,
        deliveryStatus: 'PREPARING',
        paymentStatus: 'PAYMENT_SECURED',
        notes: 'Tomato lot in packaging stage. Escrow deposit confirmed.',
        paymentEvents: [
          {
            from: 'BUYER',
            to: 'ESCROW',
            amount: 14000,
            txn_id: 'DEMO-TXN-RANCHI-001',
            at: new Date(Date.now() - 3600 * 1000 * 10),
            by: 'system',
            note: 'Advance payment secured in escrow sandbox.',
          },
        ],
        dealEvents: [
          {
            type: 'DEAL_CREATED',
            from: null,
            to: 'PENDING',
            actorPublicId: ranchiBuyer.publicId,
            actorRole: 'BUYER',
            details: { price: 28, quantity: 500, lot: tomatoLot.publicId },
            at: new Date(Date.now() - 3600 * 1000 * 12),
          },
          {
            type: 'PAYMENT_STATUS_CHANGED',
            from: 'PAYMENT_PENDING',
            to: 'PAYMENT_SECURED',
            actorPublicId: 'system',
            actorRole: 'SYSTEM',
            details: { amount: 14000, escrowRef: 'ESCROW-RNCH-01' },
            at: new Date(Date.now() - 3600 * 1000 * 10),
          },
          {
            type: 'DELIVERY_STATUS_CHANGED',
            from: 'PENDING',
            to: 'PREPARING',
            actorPublicId: farmer.publicId,
            actorRole: 'SELLER',
            details: { message: 'Farmer started crate sorting and grading' },
            at: new Date(Date.now() - 3600 * 1000 * 6),
          },
        ],
      });

      offer.dealId = existingDeal._id;
      await offer.save();

      tomatoLot.status = 'ACTIVE'; // keep active/browseable or marked with deal
      await tomatoLot.save();
    }
  }

  // Additional open offer on Onion lot for active negotiations
  if (onionLot && patnaBuyer) {
    const existingOffer = await Offer.findOne({ cropLotId: onionLot._id });
    if (!existingOffer) {
      await Offer.create({
        publicId: OfferId(),
        cropLotId: onionLot._id,
        buyerId: patnaBuyer._id,
        farmerUserPublicId: farmer.publicId,
        currentPrice: 26,
        currentQuantity: 1500,
        status: 'OPEN',
        messages: [
          {
            author: 'BUYER',
            message: 'Offering ₹26/kg for 1500 kg Onion. Can arrange transport from Nashik.',
            price: 26,
            quantity: 1500,
            createdAt: new Date(),
          },
        ],
      });
    }
  }
}

async function seedAllIfEmpty() {
  const buyerRes = await seedDemoBuyers();
  const fpoRes = await seedDemoFPOs();
  const priceRes = await seedDemoMarketPrices();
  const spRes = await seedDemoServiceProviders();
  const userRes = await seedDemoUsers();
  await seedDemoFarmerStory();

  // Backfill `activeServiceProviderId` for existing if missing
  const spUsers = await User.find({ role: 'SERVICE_PROVIDER', activeServiceProviderId: null });
  for (const u of spUsers) {
    const sp = await ServiceProvider.findOne({ email: u.email });
    if (sp) {
      u.activeServiceProviderId = sp.publicId;
      await u.save();
    }
  }

  return { buyers: buyerRes, fpos: fpoRes, market_prices: priceRes, service_providers: spRes, users: userRes };
}

module.exports = {
  seedDemoBuyers,
  seedDemoFPOs,
  seedDemoMarketPrices,
  seedDemoServiceProviders,
  seedDemoUsers,
  seedAllIfEmpty,
  DEMO_BUYERS,
  DEMO_FPOS,
  DEMO_MARKET_PRICES,
  DEMO_SERVICE_PROVIDERS,
  DEMO_USERS,
};
