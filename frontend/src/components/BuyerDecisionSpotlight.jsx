/**
 * BuyerDecisionSpotlight.jsx — Rule-based procurement decision engine for buyers.
 *
 * Evaluates active buyer demands against live AGMARKNET market benchmark prices
 * and spot trends to provide actionable procurement recommendations:
 *   - BUY_NOW: When market price <= buyer's target price or spot trend is rising
 *   - WAIT: When market price > buyer's target price or arrival volumes are peaking
 */
import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios.js'
import CropImage from './CropImage.jsx'
import { fmtInr, fmtInr2, fmtPerKg } from '../utils/format.js'
import { useLanguage } from '../hooks/LanguageContext.jsx'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  BarChart3,
  Layers,
} from 'lucide-react'

const DECISION_META = {
  BUY_NOW: {
    badge: 'bg-success-100 text-success-800 border-success-200',
    chip: 'ac-chip-success',
    label: 'Market Signal · Buy Now',
    desc: 'Current market rates align with or sit below your target ceiling. This is an illustrative recommendation based on current AGMARKNET spot prices.',
  },
  WAIT: {
    badge: 'bg-honey-100 text-honey-900 border-honey-200',
    chip: 'ac-chip-honey',
    label: 'Market Signal · Wait',
    desc: 'Spot rates currently exceed your target budget. Consider countering or waiting for the next arrival cycle. This is an illustrative recommendation only.',
  },
}

export default function BuyerDecisionSpotlight({ demands = [], activeBuyer }) {
  const { t } = useLanguage()
  const [selectedDemandIndex, setSelectedDemandIndex] = useState(0)
  const [marketData, setMarketData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const activeDemands = useMemo(() => {
    return (demands || []).filter(
      (d) => d.status === 'ACTIVE' || d.status === 'PENDING' || !d.status
    )
  }, [demands])

  const currentDemand = activeDemands[selectedDemandIndex] || activeDemands[0]

  // Fetch benchmark mandi prices when current demand changes
  useEffect(() => {
    if (!currentDemand?.crop_name) {
      setMarketData(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    const params = {
      crop: currentDemand.crop_name,
      limit: 10,
    }
    if (currentDemand.location) {
      params.state = currentDemand.location
    }

    api
      .get('/market-prices', { params })
      .then((res) => {
        if (cancelled) return
        setMarketData(res.data)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load market benchmark for buyer decision:', err)
        setError(err.response?.data?.detail || err.message)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [currentDemand?.crop_name, currentDemand?.location])

  // Compute recommendation
  const decisionResult = useMemo(() => {
    if (!currentDemand) return null

    const results = marketData?.results || []
    const prices = results
      .filter((r) => r.modal_price != null && r.modal_price > 0)
      .map((r) => r.modal_price)

    const avgMarketPrice =
      prices.length > 0
        ? Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length)
        : null

    const minMarketPrice = prices.length > 0 ? Math.min(...prices) : null
    const maxMarketPrice = prices.length > 0 ? Math.max(...prices) : null

    const targetPrice = currentDemand.max_price_per_kg
      ? Number(currentDemand.max_price_per_kg)
      : null

    let decision = 'BUY_NOW'
    let rationale = ''
    let priceDiff = 0

    if (targetPrice && avgMarketPrice) {
      priceDiff = targetPrice - avgMarketPrice
      if (avgMarketPrice <= targetPrice) {
        decision = 'BUY_NOW'
        rationale = `${t('Average benchmark price')} (₹${avgMarketPrice}/kg) ${t('is within your target maximum of')} ₹${targetPrice}/kg (${t('saving')} ₹${Math.abs(priceDiff)}/kg). ${t('Placing spot bids or farm contracts now locks in strong margins.')}`
      } else {
        decision = 'WAIT'
        rationale = `${t('Current average benchmark price')} (₹${avgMarketPrice}/kg) ${t('exceeds your target maximum of')} ₹${targetPrice}/kg ${t('by')} ₹${Math.abs(priceDiff)}/kg. ${t('We recommend placing counter offers or monitoring next week arrival volumes.')}`
      }
    } else if (avgMarketPrice) {
      decision = 'BUY_NOW'
      rationale = `${t('Spot market modal price is currently')} ₹${avgMarketPrice}/kg. ${t('Supply across monitored mandis is active with steady liquidity.')}`
    } else {
      decision = 'BUY_NOW'
      rationale = t('General market liquidity is stable. Sourcing directly from verified farmers unlocks direct margin improvements.')
    }

    return {
      decision,
      avgMarketPrice,
      minMarketPrice,
      maxMarketPrice,
      targetPrice,
      priceDiff,
      benchmarkCount: results.length,
      topMandis: results.slice(0, 3),
    }
  }, [currentDemand, marketData, t])

  // If no demands exist, show empty/guidance state
  if (!currentDemand || activeDemands.length === 0) {
    return (
      <section className="mt-8 rounded-3xl border border-earth-200 bg-gradient-to-r from-earth-50/80 via-white to-primary-50/30 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary-100 text-primary-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary-800">
                {t("Procurement Signal")}
              </span>
              <h3 className="font-display text-xl font-bold text-ink-900 mt-0.5">
                {t("Illustrative Sourcing Recommendation")}
              </h3>
            </div>
          </div>
          <Link
            to="/buyer/demands/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-primary-800"
          >
            {t("+ Publish a Demand to Unlock Signals")}
          </Link>
        </div>
        <p className="mt-3 text-sm text-ink-600 max-w-2xl">
          {t("Once you publish your crop requirements with target pricing, our rule-based heuristic cross-references live AGMARKNET mandi spot rates to provide an illustrative Buy vs. Wait market signal.")}
        </p>
      </section>
    )
  }

  const meta = DECISION_META[decisionResult?.decision] || DECISION_META.BUY_NOW

  return (
    <section className="mt-8 rounded-3xl border border-primary-200/80 bg-white p-6 sm:p-8 shadow-sm relative overflow-hidden">
      {/* Background glow accent */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary-50 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none blur-3xl opacity-50" />

      {/* Header with Title and Demand Selector */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-earth-100 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-800 border border-primary-200">
              <Sparkles className="h-3.5 w-3.5" />
              {t("Procurement Signal (Heuristic)")}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-earth-100 px-2.5 py-0.5 text-[11px] font-semibold text-ink-600">
              <ShieldCheck className="h-3 w-3 text-primary-600" />
              {t("AGMARKNET Verified")}
            </span>
          </div>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink-900 flex items-center gap-2">
            {currentDemand.crop_name}
            {currentDemand.crop_variety ? (
              <span className="text-lg font-normal text-ink-500">
                ({currentDemand.crop_variety})
              </span>
            ) : null}
          </h2>
          <p className="mt-1 text-sm text-ink-500 font-medium">
            {t("Target Ceiling")}:{' '}
            <span className="font-bold text-ink-800">
              {currentDemand.max_price_per_kg
                ? `₹${currentDemand.max_price_per_kg}/${t('kg')}`
                : t('Open Budget')}
            </span>{' '}
            · {t("Quantity Needed")}:{' '}
            <span className="font-bold text-ink-800">
              ≥{currentDemand.min_quantity_kg || 100} {t('kg')}
            </span>
          </p>
        </div>

        {/* Action / Switcher Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {activeDemands.length > 1 && (
            <div className="flex items-center gap-2 bg-earth-50 rounded-xl p-1 border border-earth-200">
              <span className="text-xs font-bold text-ink-600 px-2">{t("Demand")}:</span>
              <select
                value={selectedDemandIndex}
                onChange={(e) => setSelectedDemandIndex(Number(e.target.value))}
                className="rounded-lg border-0 bg-white py-1 px-2.5 text-xs font-bold text-ink-800 shadow-xs focus:ring-2 focus:ring-primary-500"
              >
                {activeDemands.map((d, i) => (
                  <option key={i} value={i}>
                    {d.crop_name} (≥{d.min_quantity_kg}kg)
                  </option>
                ))}
              </select>
            </div>
          )}

          <span
            className={`rounded-xl border px-4 py-2 text-xs font-extrabold uppercase tracking-wider shadow-xs ${meta.badge}`}
          >
            {t(meta.label)}
          </span>
        </div>
      </div>

      {/* Content Grid */}
      <div className="relative z-10 grid gap-6 lg:grid-cols-12">
        {/* Left column: Visual + Decision Summary */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-4">
              <CropImage
                crop={currentDemand.crop_name}
                className="h-20 w-20 rounded-2xl object-cover shadow-sm flex-shrink-0 border border-earth-100"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                  {t("Procurement Posture")}
                </p>
                <p className="font-display text-xl font-bold text-ink-900 mt-0.5">
                  {decisionResult?.decision === 'BUY_NOW'
                    ? t("Favorable Entry")
                    : t("High Volatility")}
                </p>
                <p className="mt-1 text-xs font-medium text-ink-500 flex items-center gap-1">
                  {decisionResult?.decision === 'BUY_NOW' ? (
                    <TrendingDown className="h-3.5 w-3.5 text-success-600" />
                  ) : (
                    <TrendingUp className="h-3.5 w-3.5 text-honey-600" />
                  )}
                  {decisionResult?.decision === 'BUY_NOW'
                    ? t("Rate below target ceiling")
                    : t("Rate above target ceiling")}
                </p>
              </div>
            </div>

            <div className="mt-5 text-sm leading-relaxed text-ink-700 bg-earth-50/70 rounded-2xl p-4 border border-earth-200">
              <p className="font-semibold text-xs text-ink-900 mb-1.5 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-primary-700" />
                {t("Decision Engine Rationale")}:
              </p>
              {loading ? (
                <p className="text-xs text-ink-500 italic">{t("Analyzing live mandi rates…")}</p>
              ) : (
                <p className="text-xs text-ink-800 leading-normal">
                  {decisionResult?.rationale || t(meta.desc)}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-earth-100 flex items-center justify-between text-xs text-ink-500 font-medium">
            <span>{t("Verified spot sources")}:</span>
            <span className="font-bold text-ink-700">
              {decisionResult?.benchmarkCount || 0} {t("mandis monitored")}
            </span>
          </div>
        </div>

        {/* Center column: Price Equation & Net Savings */}
        <div className="lg:col-span-4 rounded-2xl border border-primary-200 bg-gradient-to-b from-primary-50/70 to-white p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-primary-900">
                {t("Procurement Price Index")}
              </p>
              <span className="text-[10px] font-semibold text-primary-700 bg-primary-100/80 px-2 py-0.5 rounded-full">
                {t("Per Kg Metric")}
              </span>
            </div>
            <p className="text-xs text-ink-500 mt-1">
              {t("Target Ceiling vs. Mandi Benchmark Spot Rate")}
            </p>

            <div className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between items-center text-ink-700 bg-white p-2.5 rounded-xl border border-earth-100 shadow-xs">
                <span className="font-medium text-xs">{t("Buyer Target Ceiling")}:</span>
                <span className="font-bold text-ink-900 text-sm">
                  {currentDemand.max_price_per_kg
                    ? `₹${currentDemand.max_price_per_kg}/kg`
                    : t('Not set')}
                </span>
              </div>

              <div className="flex justify-between items-center text-ink-700 bg-white p-2.5 rounded-xl border border-earth-100 shadow-xs">
                <span className="font-medium text-xs">{t("Mandi Benchmark (Modal)")}:</span>
                <span className="font-bold text-primary-800 text-sm">
                  {decisionResult?.avgMarketPrice
                    ? `₹${decisionResult.avgMarketPrice}/kg`
                    : '—'}
                </span>
              </div>

              <div className="border-t border-primary-200/80 pt-3 flex justify-between items-baseline">
                <div>
                  <span className="block font-bold text-ink-900 text-xs uppercase tracking-wider">
                    {decisionResult?.priceDiff >= 0
                      ? t("Target Advantage")
                      : t("Budget Variance")}
                  </span>
                  <span className="text-[11px] text-ink-500">
                    {decisionResult?.priceDiff >= 0
                      ? t("Margin surplus")
                      : t("Above budget target")}
                  </span>
                </div>
                <span
                  className={`font-display text-2xl font-black tracking-tight ${
                    decisionResult?.priceDiff >= 0 ? 'text-success-700' : 'text-honey-800'
                  }`}
                >
                  {decisionResult?.priceDiff >= 0 ? '+' : ''}₹
                  {decisionResult?.priceDiff != null
                    ? Math.abs(decisionResult.priceDiff)
                    : 0}
                  <span className="text-xs font-normal text-ink-500">/{t('kg')}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3">
            <Link
              to={`/buyer/marketplace?crop=${encodeURIComponent(currentDemand.crop_name)}`}
              className="w-full inline-flex justify-center items-center gap-1.5 rounded-xl bg-primary-700 py-2.5 text-xs font-bold text-white transition hover:bg-primary-800 shadow-sm"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              {t("Browse Matching Farmer Lots")} →
            </Link>
          </div>
        </div>

        {/* Right column: Sourcing Channels Comparison */}
        <div className="lg:col-span-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-600">
            {t("Sourcing Channels Intelligence")}
          </p>

          {/* Direct Farm Lots */}
          <div className="rounded-2xl border border-earth-200 bg-white p-3.5 hover:border-primary-300 hover:shadow-xs transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-900">1. {t("Direct Farmer Marketplace")}</span>
              <span className="text-[10px] bg-success-50 text-success-800 border border-success-100 rounded-md px-2 py-0.5 font-bold">
                {t("Zero Middleman")}
              </span>
            </div>
            <p className="text-xs text-ink-600 mt-1 leading-relaxed">
              {t("Direct farm lots available with transparent quality grades and escrow security.")}
            </p>
          </div>

          {/* Mandi Benchmark */}
          <div className="rounded-2xl border border-earth-200 bg-white p-3.5 hover:border-primary-300 hover:shadow-xs transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-900">2. {t("Local APMC Mandis")}</span>
              <span className="text-[10px] bg-earth-100 text-ink-700 rounded-md px-2 py-0.5 font-bold">
                AGMARKNET
              </span>
            </div>
            <p className="text-xs text-ink-600 mt-1 leading-relaxed">
              {decisionResult?.topMandis?.[0]
                ? `${decisionResult.topMandis[0].market} (${decisionResult.topMandis[0].state || ''}) · ₹${decisionResult.topMandis[0].modal_price}/kg`
                : t("Spot auction rates refreshed across state mandis.")}
            </p>
          </div>

          {/* Custom RFQ Channel */}
          <div className="rounded-2xl border border-earth-200 bg-white p-3.5 hover:border-primary-300 hover:shadow-xs transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-900">3. {t("Custom RFQ Negotiation")}</span>
              <span className="text-[10px] bg-primary-50 text-primary-800 border border-primary-100 rounded-md px-2 py-0.5 font-bold">
                {t("Target Pricing")}
              </span>
            </div>
            <p className="text-xs text-ink-600 mt-1 leading-relaxed">
              {t("Farmers submit counter-bids tailored to your specific delivery timeline and volume.")}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
