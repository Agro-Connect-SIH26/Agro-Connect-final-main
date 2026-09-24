/**
 * routes/serviceProviders.js — Transporter and Cold Storage Provider endpoints.
 */
'use strict';

const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { AppError } = require('../middleware/errorHandler');
const ServiceProvider = require('../models/ServiceProvider');
const { seedDemoServiceProviders } = require('../services/seedDemo');

const router = express.Router();

function escapeRegex(s) {
  return String(s || '').replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * GET /api/service-providers
 * Query filters: service_type, type, state, district, is_nhb
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { service_type, type, state, district, is_nhb } = req.query;
    const filter = {};

    if (service_type) {
      filter.serviceType = String(service_type).toUpperCase();
    } else if (type) {
      if (type.toLowerCase().includes('cold')) {
        filter.serviceType = 'COLD_STORAGE';
      } else if (type.toLowerCase().includes('logistics') || type.toLowerCase().includes('transport')) {
        filter.serviceType = 'TRANSPORT';
      }
    }

    if (state) {
      filter.state = new RegExp(`^${escapeRegex(state)}$`, 'i');
    }
    if (district) {
      filter.district = new RegExp(`^${escapeRegex(district)}$`, 'i');
    }
    if (is_nhb != null) {
      filter.isNHB = is_nhb === 'true' || is_nhb === true;
    }

    const docs = await ServiceProvider.find(filter).sort({ createdAt: -1 });
    res.json({
      results: docs.map((d) => d.toRead()),
      total: docs.length,
    });
  })
);

/**
 * POST /api/service-providers/seed-demo
 */
router.post(
  '/seed-demo',
  asyncHandler(async (_req, res) => {
    const result = await seedDemoServiceProviders();
    res.json(result);
  })
);

/**
 * GET /api/service-providers/:publicId
 */
router.get(
  '/:publicId',
  asyncHandler(async (req, res) => {
    const { publicId } = req.params;
    const doc = await ServiceProvider.findOne({ publicId });
    if (!doc) {
      throw new AppError(404, 'Service provider not found');
    }
    res.json(doc.toRead());
  })
);

/**
 * POST /api/service-providers
 * Create or update provider profile
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const {
      name,
      service_type,
      type,
      description,
      location,
      district,
      state,
      contact,
      email,
      tags,
      vehicle_types,
      capacity,
      rate_description,
      rate_per_km,
      rate_per_kg_per_day,
      is_nhb,
    } = req.body;

    if (!name) throw new AppError(400, 'name is required');
    const resolvedType = (service_type || (type && type.toLowerCase().includes('cold') ? 'COLD_STORAGE' : 'TRANSPORT')).toUpperCase();

    const provider = new ServiceProvider({
      publicId: ServiceProvider.newPublicId(),
      name,
      serviceType: resolvedType,
      type: resolvedType === 'COLD_STORAGE' ? 'Cold Storage' : 'Logistics',
      description: description || '',
      location: location || '',
      district: district || '',
      state: state || '',
      contact: contact || '',
      email: email || '',
      tags: tags || [],
      vehicleTypes: vehicle_types || [],
      capacity: capacity || '',
      rateDescription: rate_description || '',
      ratePerKm: rate_per_km != null ? Number(rate_per_km) : null,
      ratePerKgPerDay: rate_per_kg_per_day != null ? Number(rate_per_kg_per_day) : null,
      isNHB: !!is_nhb,
      verificationStatus: 'PENDING',
    });

    await provider.save();
    res.status(201).json(provider.toRead());
  })
);

/**
 * PATCH /api/service-providers/:publicId
 * Update provider profile/capacity/rates
 */
router.patch(
  '/:publicId',
  asyncHandler(async (req, res) => {
    const { publicId } = req.params;
    const doc = await ServiceProvider.findOne({ publicId });
    if (!doc) {
      throw new AppError(404, 'Service provider not found');
    }

    const {
      name,
      description,
      location,
      district,
      state,
      contact,
      email,
      tags,
      vehicle_types,
      capacity,
      rate_description,
      rate_per_km,
      rate_per_kg_per_day,
      is_nhb,
      verification_status,
    } = req.body;

    if (name !== undefined) doc.name = name;
    if (description !== undefined) doc.description = description;
    if (location !== undefined) doc.location = location;
    if (district !== undefined) doc.district = district;
    if (state !== undefined) doc.state = state;
    if (contact !== undefined) doc.contact = contact;
    if (email !== undefined) doc.email = email;
    if (tags !== undefined) doc.tags = tags;
    if (vehicle_types !== undefined) doc.vehicleTypes = vehicle_types;
    if (capacity !== undefined) doc.capacity = capacity;
    if (rate_description !== undefined) doc.rateDescription = rate_description;
    if (rate_per_km !== undefined) doc.ratePerKm = rate_per_km != null ? Number(rate_per_km) : null;
    if (rate_per_kg_per_day !== undefined) doc.ratePerKgPerDay = rate_per_kg_per_day != null ? Number(rate_per_kg_per_day) : null;
    if (is_nhb !== undefined) doc.isNHB = !!is_nhb;
    if (verification_status !== undefined) doc.verificationStatus = verification_status;

    await doc.save();
    res.json(doc.toRead());
  })
);

module.exports = { router };
