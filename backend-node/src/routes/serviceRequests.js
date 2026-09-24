/**
 * routes/serviceRequests.js — Service Request lifecycle (Farmer <-> Service Provider).
 */
'use strict';

const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { AppError } = require('../middleware/errorHandler');
const ServiceRequest = require('../models/ServiceRequest');
const ServiceProvider = require('../models/ServiceProvider');
const User = require('../models/User');

const router = express.Router();

/**
 * POST /api/service-requests
 * Create a new service request from a farmer
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const {
      farmer_user_public_id,
      farmer_name,
      farmer_contact,
      provider_public_id,
      service_type,
      crop_lot_public_id,
      crop_name,
      crop_variety,
      quantity,
      quantity_unit,
      pickup_location,
      destination,
      duration_days,
      preferred_date,
      estimated_cost,
      notes,
    } = req.body;

    if (!provider_public_id) throw new AppError(400, 'provider_public_id is required');
    if (!service_type) throw new AppError(400, 'service_type is required');
    if (!crop_name) throw new AppError(400, 'crop_name is required');
    if (!quantity || Number(quantity) <= 0) throw new AppError(400, 'valid quantity is required');

    const provider = await ServiceProvider.findOne({ publicId: provider_public_id });
    if (!provider) {
      throw new AppError(404, 'Service Provider not found');
    }

    // Determine farmer identity
    let farmerPublicId = farmer_user_public_id;
    let name = farmer_name;
    let contact = farmer_contact;

    if (!farmerPublicId && req.demoUser) {
      farmerPublicId = req.demoUser.publicId;
      name = name || req.demoUser.displayName || req.demoUser.name;
    }

    if (!farmerPublicId) {
      farmerPublicId = 'FARMER-ANON';
    }

    const request = new ServiceRequest({
      publicId: ServiceRequest.newPublicId(),
      farmerUserPublicId: farmerPublicId,
      farmerName: name || '',
      farmerContact: contact || '',
      providerId: provider._id.toString(),
      providerPublicId: provider.publicId,
      serviceType: service_type.toUpperCase(),
      cropLotPublicId: crop_lot_public_id || null,
      cropName: crop_name,
      cropVariety: crop_variety || '',
      quantity: Number(quantity),
      quantityUnit: quantity_unit || 'kg',
      pickupLocation: pickup_location || '',
      destination: destination || '',
      durationDays: duration_days != null ? Number(duration_days) : null,
      preferredDate: preferred_date || '',
      estimatedCost: estimated_cost != null ? Number(estimated_cost) : null,
      notes: notes || '',
      status: 'REQUESTED',
    });

    await request.save();
    res.status(201).json(request.toRead());
  })
);

/**
 * GET /api/service-requests
 * Filter by provider_public_id, farmer_user_public_id, status, service_type
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      provider_public_id,
      farmer_user_public_id,
      crop_lot_public_id,
      status,
      service_type,
    } = req.query;

    const filter = {};
    if (provider_public_id) filter.providerPublicId = provider_public_id;
    if (farmer_user_public_id) filter.farmerUserPublicId = farmer_user_public_id;
    if (crop_lot_public_id) filter.cropLotPublicId = crop_lot_public_id;
    if (status) filter.status = String(status).toUpperCase();
    if (service_type) filter.serviceType = String(service_type).toUpperCase();

    const docs = await ServiceRequest.find(filter).sort({ createdAt: -1 });
    res.json({
      results: docs.map((d) => d.toRead()),
      total: docs.length,
    });
  })
);

/**
 * GET /api/service-requests/:publicId
 */
router.get(
  '/:publicId',
  asyncHandler(async (req, res) => {
    const { publicId } = req.params;
    const doc = await ServiceRequest.findOne({ publicId });
    if (!doc) throw new AppError(404, 'Service request not found');
    res.json(doc.toRead());
  })
);

/**
 * PATCH /api/service-requests/:publicId/status
 * Handle status updates: ACCEPTED, REJECTED, IN_PROGRESS, COMPLETED, CANCELLED
 */
router.patch(
  '/:publicId/status',
  asyncHandler(async (req, res) => {
    const { publicId } = req.params;
    const { status, provider_quote, notes } = req.body;

    if (!status) throw new AppError(400, 'status is required');
    const validStatuses = ['REQUESTED', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    const nextStatus = String(status).toUpperCase();
    if (!validStatuses.includes(nextStatus)) {
      throw new AppError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const doc = await ServiceRequest.findOne({ publicId });
    if (!doc) throw new AppError(404, 'Service request not found');

    doc.status = nextStatus;
    if (provider_quote != null) {
      doc.providerQuote = Number(provider_quote);
    }
    if (notes) {
      doc.notes = notes;
    }

    await doc.save();
    res.json(doc.toRead());
  })
);

module.exports = { router };
