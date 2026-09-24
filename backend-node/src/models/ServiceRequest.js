/**
 * models/ServiceRequest.js — Farmer to Transporter / Cold Storage request.
 */
'use strict';

const mongoose = require('mongoose');
const { SRId } = require('../utils/publicId');

const { Schema } = mongoose;

const ServiceRequestSchema = new Schema(
  {
    publicId: { type: String, unique: true, index: true, required: true },
    farmerUserPublicId: { type: String, required: true, index: true },
    farmerName: { type: String, default: '' },
    farmerContact: { type: String, default: '' },
    providerId: { type: String, default: null }, // provider _id or publicId
    providerPublicId: { type: String, required: true, index: true },
    serviceType: {
      type: String,
      enum: ['TRANSPORT', 'COLD_STORAGE'],
      required: true,
      index: true,
    },
    cropLotPublicId: { type: String, default: null, index: true },
    cropName: { type: String, required: true },
    cropVariety: { type: String, default: '' },
    quantity: { type: Number, required: true },
    quantityUnit: { type: String, default: 'kg' },
    pickupLocation: { type: String, default: '' },
    destination: { type: String, default: '' },
    durationDays: { type: Number, default: null },
    preferredDate: { type: String, default: '' },
    estimatedCost: { type: Number, default: null },
    providerQuote: { type: Number, default: null },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['REQUESTED', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'REQUESTED',
      index: true,
    },
  },
  { timestamps: true }
);

ServiceRequestSchema.statics.newPublicId = SRId;

ServiceRequestSchema.methods.toRead = function () {
  return {
    id: this._id,
    public_id: this.publicId,
    farmer_user_public_id: this.farmerUserPublicId,
    farmer_name: this.farmerName,
    farmer_contact: this.farmerContact,
    provider_id: this.providerId,
    provider_public_id: this.providerPublicId,
    service_type: this.serviceType,
    crop_lot_public_id: this.cropLotPublicId,
    crop_name: this.cropName,
    crop_variety: this.cropVariety,
    quantity: this.quantity,
    quantity_unit: this.quantityUnit,
    pickup_location: this.pickupLocation,
    destination: this.destination,
    duration_days: this.durationDays,
    preferred_date: this.preferredDate,
    estimated_cost: this.estimatedCost,
    provider_quote: this.providerQuote,
    notes: this.notes,
    status: this.status,
    created_at: this.createdAt,
    updated_at: this.updatedAt,
  };
};

module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);
