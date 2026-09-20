/**
 * routes/marketPrices.js — market price endpoints.
 *
 *   GET  /api/market-prices                  list (filters: crop, state, market, district)
 *   GET  /api/market-prices/health           provider health
 *
 * The service in services/marketPrice decides whether to call the
 * live data.gov.in/AGMARKNET provider or fall back to the demo
 * dataset. The route's wire shape is frontend-aligned: each row has
 * snake_case keys the React MarketPrices.jsx page already reads
 * (crop_name, market, location, min_price, modal_price, max_price,
 * price_date, unit, source, is_live) and the envelope carries
 * `fetched_at`.
 *
 * No API key is ever echoed in the response.
 */
'use strict';

const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const MarketPrice = require('../models/MarketPrice');

const {
  listPrices,
  health: providerHealth,
} = require('../services/marketPrice/service');

const {
  listHistorical,
} = require('../services/marketPrice/historyAggregator');

const {
  predictPrice,
} = require('../services/marketPrice/predictionService');

const {
  predictPriceML,
} = require('../services/marketPrice/mlPrediction');

const {
  annotate: annotateCoords,
  lookup: lookupCoord,
} = require('../services/mandiCoords');

const router = express.Router();

/**
 * GET /api/market-prices/metadata
 *
 * Returns dependent dropdown options for crop, state, and district.
 * Uses MongoDB distinct() on indexed fields to derive availability
 * from the actual database without loading the entire collection.
 */
router.get(
  '/metadata',
  asyncHandler(async (req, res) => {
    const { crop, state } = req.query;

    if (crop && state) {
      // 3. Requesting districts for a specific crop and state
      const districts = await MarketPrice.distinct('district', {
        cropName: String(crop),
        state: String(state),
        district: { $ne: '' }
      });
      return res.json({
        districts: districts.sort(),
        fetched_at: new Date().toISOString()
      });
    }

    if (crop) {
      // 2. Requesting states for a specific crop
      const states = await MarketPrice.distinct('state', {
        cropName: String(crop),
        state: { $ne: '' }
      });
      return res.json({
        states: states.sort(),
        fetched_at: new Date().toISOString()
      });
    }

    // 1. Initial load: return all crops
    const crops = await MarketPrice.distinct('cropName', { cropName: { $ne: '' } });
    return res.json({
      crops: crops.sort(),
      fetched_at: new Date().toISOString(),
    });
  })
);

/**
 * Map a single row (camelCase orchestrator row OR snake_case toRead
 * doc) into the canonical frontend-aligned shape.
 */
function toWireRow(r) {
  // Support both camelCase orchestrator rows and snake_case toRead().
  const cropName = r.cropName || r.crop_name || '';
  const market = r.market || '';
  const state = r.state || '';
  const district = r.district || '';

  // Phase 3 — missing numerics are surfaced as `null`, never undefined
  // and never the dreaded NaN. Consumers can render "—" safely.
  const numOrNull = (v) => {
    if (v === null || v === undefined || v === '') return null;

    const n = Number(v);

    return Number.isFinite(n) ? n : null;
  };

  const perKg = numOrNull(
    r.pricePerKg != null
      ? r.pricePerKg
      : r.price_per_kg
  );

  const perQuintal = numOrNull(
    r.pricePerQuintal != null
      ? r.pricePerQuintal
      : r.price_per_quintal
  );

  const minPerKg = numOrNull(
    r.minPricePerKg != null
      ? r.minPricePerKg
      : r.min_price != null
      ? r.min_price
      : perKg
  );

  const maxPerKg = numOrNull(
    r.maxPricePerKg != null
      ? r.maxPricePerKg
      : r.max_price != null
      ? r.max_price
      : perKg
  );

  const priceDate =
    r.priceDate ||
    r.arrivalDate ||
    r.arrival_date ||
    r.price_date ||
    '';

  const location = [market, district]
    .filter(Boolean)
    .join(', ');

  return {
    crop_name: cropName,
    market,
    state,
    district,
    location,

    // Defensive: always null when unknown.
    min_price: minPerKg,
    modal_price: perKg,
    max_price: maxPerKg,

    price_per_quintal: perQuintal,
    price_per_kg: perKg,

    unit: r.unit || 'INR/kg',

    price_date: priceDate,
    arrival_date: priceDate,

    source: r.source || 'demo',

    is_live:
      !!r.isLive ||
      !!r.is_live,

    // Lat/lon are filled by annotateCoords() after toWireRow().
    lat: Number.isFinite(Number(r.lat))
      ? Number(r.lat)
      : null,

    lon: Number.isFinite(Number(r.lon))
      ? Number(r.lon)
      : null,

    coord_source:
      r._coord_source || null,
  };
}

/**
 * GET /api/market-prices
 *
 * Returns current market prices.
 *
 * CRITICAL FIX (Phase 5):
 * When both crop AND state are missing, return a safe empty response.
 * This prevents an unfiltered find({}).lean() scan over 1.68M documents.
 *
 * The frontend MUST first display crop/state dropdowns, and the user
 * must select BOTH before any market-price data loads.
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const filters = {
      crop: req.query.crop,
      state: req.query.state,
      market: req.query.market,
      district: req.query.district,
    };

    /*
     * SAFETY GATE: Crop and state are mandatory.
     *
     * This is the primary defense against the 1.68M document
     * heap-exhaustion bug. Without both, the query would scan
     * the entire collection. Return a safe empty response instead.
     */
    if (!filters.crop || !filters.state) {
      return res.json({
        source: 'none',
        is_live: false,
        count: 0,
        note:
          'Crop and state are required. Please select both from the dropdowns.',
        unit: 'INR/kg',
        fetched_at: new Date().toISOString(),
        results: [],
      });
    }

    // Trigger the orchestrator (live → CSV → demo) so the caller
    // receives the freshest available data.
    let {
      rows,
      is_live,
      source,
      note,
    } = await listPrices(filters);

    /*
     * Also include cached MongoDB rows.
     *
     * PERFORMANCE FIX:
     *
     * Previously this query used case-insensitive regex filters and
     * sorted the entire matching result set by createdAt.
     *
     * With ~1.6M+ MarketPrice documents, that created a significant
     * amount of unnecessary MongoDB work.
     *
     * Crop and state are controlled/canonical values from the
     * application, so exact equality is sufficient here.
     *
     * We intentionally do NOT sort by createdAt. The frontend does
     * not require cached rows to be ordered by creation time, and
     * removing this sort allows MongoDB to use the existing
     * crop/state indexes efficiently.
     */
    const q = {};

    if (filters.crop) {
      q.cropName = String(filters.crop);
    }

    if (filters.state) {
      q.state = String(filters.state);
    }

    /*
     * Market and district remain regex-based because these fields
     * can be searched using partial/case-insensitive values.
     */
    if (filters.market) {
      q.market = new RegExp(
        escapeRegex(String(filters.market)),
        'i'
      );
    }

    if (filters.district) {
      q.district = new RegExp(
        `^${escapeRegex(String(filters.district))}$`,
        'i'
      );
    }

    /*
     * No createdAt sort here.
     *
     * lean() avoids creating full Mongoose document instances for
     * thousands of cached market-price rows.
     *
     * Bounded query: limit to prevent excessive memory usage.
     */
    const cached = await MarketPrice
      .find(q)
      .limit(200)
      .lean();

    /*
     * Merge: prefer the orchestrator's rows first; add cached entries
     * not already present.
     */
    const seen = new Set(
      rows.map(
        (r) =>
          `${r.cropName}|${r.market}|${r.state}|${
            r.arrivalDate || ''
          }`
      )
    );

    const merged = rows.map(toWireRow);

    for (const c of cached) {
      const doc = {
        crop_name: c.cropName || '',
        market: c.market || '',
        state: c.state || '',
        district: c.district || '',

        price_per_kg: c.pricePerKg,
        price_per_quintal: c.pricePerQuintal,

        min_price: c.minPricePerKg,
        max_price: c.maxPricePerKg,

        price_date:
          c.priceDate ||
          c.arrivalDate ||
          '',

        arrival_date:
          c.arrivalDate ||
          c.priceDate ||
          '',

        unit:
          c.unit ||
          'INR/kg',

        source:
          c.source ||
          'demo',

        is_live:
          !!c.isLive,

        lat: c.lat,
        lon: c.lon,

        _coord_source:
          c._coord_source,
      };

      const k =
        `${doc.crop_name}|${doc.market}|${doc.state}|${
          doc.arrival_date || ''
        }`;

      if (!seen.has(k)) {
        merged.push(toWireRow(doc));
        seen.add(k);
      }
    }

    // Paginate merged rows
    const totalCount = merged.length;
    const paginatedRows = merged.slice(skip, skip + limit);

    // All rows from the orchestrator share the same unit.
    const unit =
      paginatedRows[0] && paginatedRows[0].unit
        ? paginatedRows[0].unit
        : 'INR/kg';

    /*
     * Attach mandi centroids.
     *
     * These are well-known public-reference coordinates, not live GPS.
     */
    const withCoords =
      annotateCoords(paginatedRows);

    // If the database cache provided live records but the orchestrator
    // fell back to demo (e.g. live fetch returned 0 rows for this filter),
    // ensure the top-level response accurately reflects that we are
    // returning live data.
    const hasLiveRows = withCoords.some(
      (r) => r.is_live || r.source === 'data_gov_in'
    );

    if (hasLiveRows && !is_live) {
      is_live = true;
      source = 'data_gov_in';
      note = 'Live data.gov.in rows in use.';
    }

    res.json({
      source,
      is_live,
      count: withCoords.length,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
      note,
      unit,
      fetched_at:
        new Date().toISOString(),
      results: withCoords,
    });
  })
);

router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    const h = await providerHealth();
    res.json(h);
  })
);

// Phase 3 — historical aggregation (NOT a forecast).
router.get(
  '/history',
  asyncHandler(async (req, res) => {
    const {
      crop,
      state,
      market,
      from,
      to,
      granularity = 'weekly',
    } = req.query;

    const result =
      await listHistorical({
        crop,
        state,
        market,
        from,
        to,
        granularity:
          ['daily', 'weekly', 'monthly'].includes(
            String(granularity)
          )
            ? granularity
            : 'weekly',
      });

    res.json(result);
  })
);

// Phase 3 — placeholder prediction.
router.get(
  '/prediction',
  asyncHandler(async (req, res) => {
    const {
      crop,
      state,
      market,
      days,
      min_history_dates,
    } = req.query;

    const daysNum = days
      ? Math.max(
          1,
          Math.min(
            30,
            Number(days) || 7
          )
        )
      : 7;

    const minHist = min_history_dates
      ? Math.max(
          2,
          Math.min(
            20,
            Number(min_history_dates) || 5
          )
        )
      : 5;

    const result =
      await predictPrice({
        crop,
        state,
        market,
        days: daysNum,
        minHistoryDates: minHist,
      });

    res.json(result);
  })
);

// Phase 5 — ML prediction with baseline comparison.
router.get(
  '/prediction-ml',
  asyncHandler(async (req, res) => {
    const {
      crop,
      state,
      market,
      days,
      min_history_dates,
      holdout_days,
    } = req.query;

    const daysNum = days
      ? Math.max(
          1,
          Math.min(
            30,
            Number(days) || 7
          )
        )
      : 7;

    const minHist = min_history_dates
      ? Math.max(
          2,
          Math.min(
            60,
            Number(min_history_dates) || 10
          )
        )
      : 10;

    const holdout = holdout_days
      ? Math.max(
          2,
          Math.min(
            60,
            Number(holdout_days) || 14
          )
        )
      : 14;

    const result =
      await predictPriceML({
        crop,
        state,
        market,
        days: daysNum,
        minHistoryDates: minHist,
        holdoutDays: holdout,
      });

    res.json(result);
  })
);

// Phase 5 — daily series for a chart.
router.get(
  '/history/series',
  asyncHandler(async (req, res) => {
    const {
      crop,
      state,
      market,
      from,
      to,
      limit,
    } = req.query;

    if (!crop) {
      res.status(400).json({
        error: 'crop is required',
      });
      return;
    }

    /*
     * PERFORMANCE FIX:
     *
     * Use exact equality for crop/state/market instead of
     * case-insensitive regex.
     *
     * This allows MongoDB to use:
     *
     *   { cropName: 1, state: 1, priceDate: 1 }
     *
     * for filtering and sorting.
     */
    const filter = {
      cropName: String(crop),
    };

    if (state) {
      filter.state = String(state);
    }

    if (market) {
      filter.market = String(market);
    }

    if (from || to) {
      filter.priceDate = {};

      if (from) {
        filter.priceDate.$gte =
          String(from);
      }

      if (to) {
        filter.priceDate.$lte =
          String(to);
      }
    }

    const cap = Math.max(
      50,
      Math.min(
        5000,
        Number(limit) || 1500
      )
    );

    const docs =
      await MarketPrice
        .find(filter)
        .sort({ priceDate: 1 })
        .limit(cap)
        .lean();

    const points = docs
      .filter(
        (d) =>
          d.priceDate &&
          d.pricePerKg != null
      )
      .map((d) => ({
        date: d.priceDate,
        crop: d.cropName,
        market: d.market,
        state: d.state,
        price_per_kg:
          d.pricePerKg,
        price_per_quintal:
          d.pricePerQuintal,
        source: d.source,
      }));

    res.json({
      crop,
      state: state || null,
      market: market || null,
      from: from || null,
      to: to || null,
      count: points.length,
      points,
    });
  })
);

/**
 * Escape special regex characters.
 */
function escapeRegex(value) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
}

module.exports = {
  router,
};