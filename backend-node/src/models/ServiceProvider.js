/**
 * models/ServiceProvider.js — Transporter or Cold Storage Provider profile.
 */
'use strict';

const mongoose = require('mongoose');
const { SPId } = require('../utils/publicId');

const { Schema } = mongoose;

const ServiceProviderSchema = new Schema(
  {
    publicId: { type: String, unique: true, index: true, required: true },
    name: { type: String, required: true },
    serviceType: {
      type: String,
      enum: ['TRANSPORT', 'COLD_STORAGE'],
      required: true,
      index: true,
    },
    // legacy string type ('Logistics' | 'Cold Storage') for backward compatibility
    type: { type: String, default: 'Logistics' },
    description: { type: String, default: '' },
    location: { type: String, default: '' },
    district: { type: String, default: '' },
    state: { type: String, default: '' },
    contact: { type: String, default: '' },
    email: { type: String, default: '' },
    tags: { type: [String], default: [] },
    vehicleTypes: { type: [String], default: [] },
    capacity: { type: String, default: '' },
    rateDescription: { type: String, default: '' },
    ratePerKm: { type: Number, default: null },
    ratePerKgPerDay: { type: Number, default: null },
    isNHB: { type: Boolean, default: false },
    isDemo: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ['NOT_VERIFIED', 'PENDING', 'VERIFIED'],
      default: 'NOT_VERIFIED',
    },
  },
  { timestamps: true }
);

ServiceProviderSchema.statics.newPublicId = SPId;

ServiceProviderSchema.methods.toRead = function () {
  return {
    id: this._id,
    public_id: this.publicId,
    name: this.name,
    service_type: this.serviceType,
    type: this.type,
    description: this.description,
    location: this.location,
    district: this.district,
    state: this.state,
    contact: this.contact,
    email: this.email,
    tags: this.tags,
    vehicle_types: this.vehicleTypes,
    capacity: this.capacity,
    rate_description: this.rateDescription,
    rate_per_km: this.ratePerKm,
    rate_per_kg_per_day: this.ratePerKgPerDay,
    is_nhb: this.isNHB,
    is_demo: this.isDemo,
    verification_status: this.verificationStatus,
    created_at: this.createdAt,
    updated_at: this.updatedAt,
  };
};

module.exports = mongoose.model('ServiceProvider', ServiceProviderSchema);
