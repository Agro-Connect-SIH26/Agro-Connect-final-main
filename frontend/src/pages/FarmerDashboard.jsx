/**
 * pages/FarmerDashboard.jsx — The Intelligent Selling Workspace for Farmers.
 *
 * Core Architecture:
 * 1. Conversational Hero: Actionable natural language greeting & status summary.
 * 2. Action Canvas: Contextual alert items needing farmer action.
 * 3. Top Decision Spotlight: Highest priority lot with 4-way channel comparison and Net Realization equation.
 * 4. Active Portfolio Pipeline: Grouped crop lots with stage badges and direct selling path triggers.
 * 5. Market Pulse Snapshot: Live Mandi benchmark pricing for farmer's active crops.
 * 6. Active Offers Board: Incoming buyer offers ready for review and negotiation.
 * 7. FPO Collective Network: Pooling opportunities for higher net margins.
 */
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import CropImage from '../components/CropImage.jsx'
import AttentionStrip from '../components/AttentionStrip.jsx'
import EmptyState from '../components/EmptyState.jsx'
import usePageMeta from '../hooks/usePageMeta.js'
import { useLanguage } from '../hooks/LanguageContext.jsx'
import {
  fetchMyCropLots,
  selectMyLots,
  selectMyLotsStatus,
} from '../redux/slices/cropLotSlice.js'
import { selectName } from '../redux/slices/authSlice.js'
import { fetchOffers } from '../redux/slices/offerSlice.js'
import { fetchFpos } from '../redux/slices/fpoSlice.js'
import api from '../api/axios.js'
import { fmtInr, fmtInr2 } from '../utils/format.js'

// ---- Decision tone mapping ----
const DECISION_META = {
  SELL_NOW: {
    badge: 'bg-success-100 text-success-800 border-success-200',
    chip: 'ac-chip-success',
    label: 'Sell now',
    desc: 'Market conditions favor selling now. Lock in prices to avoid storage loss.',
  },
  WAIT: {
    badge: 'bg-honey-100 text-honey-900 border-honey-200',
    chip: 'ac-chip-honey',
    label: 'Hold for better price',
    desc: 'Prices projected to improve. Store produce if holding cost is low.',
  },
  GROUP_SALE: {
    badge: 'bg-primary-100 text-primary-900 border-primary-200',
    chip: 'ac-chip-primary',
    label: 'Group sale via FPO',
    desc: 'Pool with nearby farmers to unlock bulk premium from institutional buyers.',
  },
}

function useGreeting() {
  const { t } = useLanguage()
  const hour = new Date().getHours()
  if (hour < 12) return t('Good morning')
  if (hour < 17) return t('Good afternoon')
  return t('Good evening')
}

// ---------------------------------------------------------------------------
// 1. Conversational Hero
// ---------------------------------------------------------------------------
function ConversationalHero({ name, lots, offers, decisions }) {
  const { t } = useLanguage()
  const greeting = useGreeting()
  const activeLots = lots.filter((l) => l.status === 'ACTIVE')
  const openOffersCount = offers.filter((o) => o.status === 'OPEN' || o.status === 'COUNTERED').length

  // Count lots with clear action recommendations
  const sellNowCount = activeLots.filter((l) => {
    const d = decisions[l.public_id || l._id]
    return d?.decision === 'SELL_NOW'
  }).length

  // Build natural language summary
  const firstName = name ? name.split(' ')[0] : ''

  const summaryText = useMemo(() => {
    if (activeLots.length === 0) {
      return t("You don't have any active crop lots listed yet. Start by adding a crop to analyze selling channels.")
    }
    const parts = []
    parts.push(`${t("You have")} ${activeLots.length} ${activeLots.length === 1 ? t("active crop lot") : t("active crop lots")}.`)
    if (openOffersCount > 0) {
      parts.push(`${openOffersCount} ${openOffersCount === 1 ? t("buyer offer requires your attention") : t("buyer offers require your attention")}.`)
    }
    if (sellNowCount > 0) {
      parts.push(`${sellNowCount} ${sellNowCount === 1 ? t("lot is in optimal selling window") : t("lots are in optimal selling window")}.`)
    } else {
      parts.push(t("Market prices are steady across monitored mandis."))
    }
    return parts.join(' ')
  }, [activeLots.length, openOffersCount, sellNowCount, t])

  return (
    <div className="relative overflow-hidden rounded-3xl border border-earth-200 bg-white p-8 shadow-sm">
      {/* Subtle modern background accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary-50 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none blur-3xl opacity-60" />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-800 border border-primary-100">
            <span className="flex h-2 w-2 rounded-full bg-success-500 animate-pulse" />
            {t("Farmer Selling Workspace")}
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
            {greeting}{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-700">
            {summaryText}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:flex-col lg:items-stretch lg:gap-3">
          <Link
            to="/seller/crop-lots/new"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary-700 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-primary-700/20 transition hover:bg-primary-800 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {t("Smart Sell Crop")}
          </Link>
          <Link
            to="/seller/demands"
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-earth-200 bg-white px-6 py-3.5 text-sm font-bold text-ink-800 shadow-sm transition hover:border-earth-300 hover:bg-earth-50 hover:shadow-inner"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {t("Find Buyers")}
          </Link>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 2. Decision Spotlight Component
// ---------------------------------------------------------------------------
function DecisionSpotlight({ lot, decisionData, offers }) {
  const { t } = useLanguage()
  if (!lot) return null

  const d = decisionData
  const decisionType = d?.decision || 'WAIT'
  const meta = DECISION_META[decisionType] || DECISION_META.WAIT
  const comparison = d?.market_comparison || []
  const bestOption = comparison[0]

  // Net realization calculation breakdown
  const qtyKg = Number(lot.quantity_kg || lot.quantity || 1000)
  const grossValue = bestOption?.gross_realisation || (bestOption?.modal_price ? bestOption.modal_price * qtyKg : 0)
  const logisticsCost = bestOption?.logistics_cost || (bestOption?.distance_km ? bestOption.distance_km * 4.5 : 450)
  const storageCost = bestOption?.storage_cost || 0
  const netInHand = bestOption?.net_realisation || (grossValue - logisticsCost - storageCost)

  const lotOffers = offers.filter((o) => (o.lot_id === (lot._id || lot.public_id)) || (o._lot?.public_id === lot.public_id))

  return (
    <section className="mt-10 rounded-3xl border border-primary-200/80 bg-white p-6 sm:p-8 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-earth-100 pb-6 mb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-800 border border-primary-200">
            ★ {t("Priority Selling Spotlight")}
          </span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink-900">
            {lot.crop_name} {lot.crop_variety ? `(${lot.crop_variety})` : ''}
          </h2>
          <p className="mt-1 text-sm text-ink-500 font-medium">
            {lot.quantity} {t(lot.quantity_unit || 'Quintals')} · {lot.location} {lot.state ? `(${lot.state})` : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-xs ${meta.badge}`}>
            {t(meta.label)}
          </span>
          <Link
            to={`/seller/crop-lots/${lot.public_id || lot._id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-earth-200 bg-earth-50 px-4 py-2 text-xs font-bold text-ink-800 hover:bg-earth-100 hover:border-earth-300 transition"
          >
            {t("Full Analysis")} →
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left column: Visual + Rationale */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-4">
              <CropImage crop={lot.crop_name} className="h-24 w-24 rounded-2xl object-cover shadow-sm flex-shrink-0 border border-earth-100" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">{t("Quality Grade")}</p>
                <p className="font-display text-xl font-bold text-ink-900">
                  {lot.grade ? `${t("Grade")} ${lot.grade}` : (lot.farmer_quality_grade ? `${t("Grade")} ${lot.farmer_quality_grade}` : t("Standard Fair Average"))}
                </p>
                <p className="mt-1 text-xs font-medium text-ink-500">
                  {lot.harvest_date ? `${t("Harvested")}: ${new Date(lot.harvest_date).toLocaleDateString()}` : t("Ready for dispatch")}
                </p>
              </div>
            </div>
            <div className="mt-5 text-sm leading-relaxed text-ink-700 bg-earth-50/70 rounded-2xl p-4 border border-earth-200">
              <p className="font-semibold text-xs text-ink-900 mb-1">{t("Decision Engine Rationale")}:</p>
              {d?.rationale ? t(d.rationale) : t(meta.desc)}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-earth-100 flex items-center justify-between">
            <span className="text-xs text-ink-500 font-medium">{t("Active buyer interest")}: </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-bold text-primary-800">
              {lotOffers.length > 0 ? `${lotOffers.length} ${t("offers placed")}` : t("Matching buyers nearby")}
            </span>
          </div>
        </div>

        {/* Center column: The Net Realization Equation */}
        <div className="lg:col-span-4 rounded-2xl border border-primary-200 bg-gradient-to-b from-primary-50/80 to-primary-50/30 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-primary-900">
                {t("Net Realization Equation")}
              </p>
              <span className="text-[10px] font-semibold text-primary-700 bg-primary-100/80 px-2 py-0.5 rounded-full">
                {t("Transparent Math")}
              </span>
            </div>
            <p className="text-xs text-ink-500 mt-1">
              {t("Gross Market Value − Logistics − Storage = Estimated In-Hand")}
            </p>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between items-center text-ink-700">
                <span className="font-medium">{t("Gross Realization")}:</span>
                <span className="font-bold text-ink-900">₹{fmtInr(grossValue)}</span>
              </div>
              <div className="flex justify-between items-center text-rust-700">
                <span className="font-medium">− {t("Logistics / Freight")}:</span>
                <span className="font-bold">₹{fmtInr(logisticsCost)}</span>
              </div>
              <div className="flex justify-between items-center text-honey-800">
                <span className="font-medium">− {t("Storage / Wastage")}:</span>
                <span className="font-bold">₹{fmtInr(storageCost)}</span>
              </div>
              <div className="border-t border-primary-200/80 pt-3 flex justify-between items-baseline">
                <div>
                  <span className="block font-bold text-ink-900 text-xs uppercase tracking-wider">{t("Estimated Net In Hand")}</span>
                  <span className="text-[11px] text-ink-500">{t("Direct to your bank")}</span>
                </div>
                <span className="font-display text-3xl font-black tracking-tight text-success-700">
                  ₹{fmtInr(netInHand)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3">
            <Link
              to={`/seller/crop-lots/${lot.public_id || lot._id}`}
              className="w-full inline-flex justify-center items-center rounded-xl bg-primary-700 py-3 text-xs font-bold text-white transition hover:bg-primary-800 shadow-sm"
            >
              {t("Explore All Selling Channels")} →
            </Link>
          </div>
        </div>

        {/* Right column: 3 Comparative Selling Channels */}
        <div className="lg:col-span-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-600">
            {t("Selling Channels Overview")}
          </p>

          {/* Direct Buyer Channel */}
          <div className="rounded-2xl border border-earth-200 bg-white p-4 hover:border-primary-300 hover:shadow-xs transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-900">1. {t("Direct Buyer Trade")}</span>
              <span className="text-[11px] bg-primary-50 text-primary-800 border border-primary-100 rounded-md px-2 py-0.5 font-bold">{t("No Mandi Fee")}</span>
            </div>
            <p className="text-xs text-ink-600 mt-1.5 leading-relaxed">
              {lotOffers.length > 0 ? `${lotOffers.length} ${t("active offer(s) waiting")}` : t("Direct buyers active for this crop")}
            </p>
          </div>

          {/* Mandi Channel */}
          <div className="rounded-2xl border border-earth-200 bg-white p-4 hover:border-primary-300 hover:shadow-xs transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-900">2. {t("Local Mandi Benchmark")}</span>
              <span className="text-[11px] bg-earth-100 text-ink-700 rounded-md px-2 py-0.5 font-bold">AGMARKNET</span>
            </div>
            <p className="text-xs text-ink-600 mt-1.5 leading-relaxed">
              {bestOption?.market ? `${bestOption.market} · ₹${fmtInr2(bestOption.modal_price)}/kg` : t("Live mandi rates available")}
            </p>
          </div>

          {/* FPO Pooling Channel */}
          <div className="rounded-2xl border border-earth-200 bg-white p-4 hover:border-primary-300 hover:shadow-xs transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-900">3. {t("FPO Group Pooling")}</span>
              <span className="text-[11px] bg-success-50 text-success-800 border border-success-100 rounded-md px-2 py-0.5 font-bold">+5-10% {t("Bulk Premium")}</span>
            </div>
            <p className="text-xs text-ink-600 mt-1.5 leading-relaxed">
              {t("Pool lot with nearby farmers to negotiate directly with institutional buyers")}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// 3. Active Crop Portfolio Pipeline
// ---------------------------------------------------------------------------
function PortfolioPipeline({ lots, decisions }) {
  const { t } = useLanguage()
  const [filter, setFilter] = useState('ALL')

  const activeLots = lots.filter((l) => l.status === 'ACTIVE')

  const filteredLots = useMemo(() => {
    if (filter === 'ALL') return activeLots
    return activeLots.filter((l) => {
      const d = decisions[l.public_id || l._id]?.decision
      return d === filter
    })
  }, [activeLots, decisions, filter])

  if (activeLots.length === 0) {
    return (
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="ac-section-label">{t("Crop Portfolio")}</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink-900">
              {t("Your Crop Lots")}
            </h2>
          </div>
        </div>
        <EmptyState
          className="mt-4"
          kind="info"
          title={t("No crop lots in your inventory")}
          description={t("List your harvest or standing crop to calculate net realization, mandi comparisons, and buyer matches.")}
          action={
            <Link to="/seller/crop-lots/new" className="ac-btn-primary">
              {t("Add crop lot")}
            </Link>
          }
        />
      </section>
    )
  }

  return (
    <section className="mt-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <p className="ac-section-label font-bold tracking-wider uppercase text-xs text-primary-800">{t("Crop Portfolio")}</p>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink-900">
            {t("Active Farm Inventory Pipeline")}
          </h2>
          <p className="mt-1 text-sm text-ink-600 font-medium">
            {activeLots.length} {activeLots.length === 1 ? t("crop lot ready for decision and trade") : t("crop lots ready for decision and trade")}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1 rounded-2xl border border-earth-200 bg-white p-1.5 shadow-xs">
          {['ALL', 'SELL_NOW', 'WAIT', 'GROUP_SALE'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                filter === f
                  ? 'bg-primary-700 text-white shadow-sm'
                  : 'text-ink-600 hover:bg-earth-100 hover:text-ink-900'
              }`}
            >
              {f === 'ALL' ? t("All Lots") : t(DECISION_META[f]?.label || f)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredLots.map((lot) => {
          const d = decisions[lot.public_id || lot._id]
          const decision = d?.decision || 'WAIT'
          const meta = DECISION_META[decision] || DECISION_META.WAIT
          const comp = d?.market_comparison || []
          const bestNet = comp[0]?.net_realisation

          return (
            <div
              key={lot._id || lot.public_id}
              className="rounded-3xl border border-earth-200 bg-white p-6 shadow-xs transition hover:border-primary-300 hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <CropImage crop={lot.crop_name} className="h-16 w-16 rounded-2xl object-cover border border-earth-100" />
                    <div>
                      <h3 className="font-display text-lg font-bold text-ink-900">
                        {lot.crop_name}
                      </h3>
                      <p className="text-xs font-medium text-ink-500">
                        {lot.crop_variety ? `${lot.crop_variety} · ` : ''}{lot.quantity} {t(lot.quantity_unit || 'Quintals')}
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-bold shadow-xs ${meta.badge}`}>
                    {t(meta.label)}
                  </span>
                </div>

                <div className="mt-6 rounded-2xl bg-earth-50/70 p-4 border border-earth-100">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">{t("Est. Net Realization")}</span>
                    <span className="font-display text-xl font-black text-success-700">
                      {bestNet != null ? `₹${fmtInr(bestNet)}` : t("Calculating…")}
                    </span>
                  </div>
                  {comp[0]?.market && (
                    <p className="text-[11px] font-medium text-ink-600 truncate">
                      {t("Optimal market")}: <span className="font-semibold text-ink-800">{comp[0].market}</span>
                    </p>
                  )}
                </div>

                <p className="mt-4 text-sm leading-relaxed text-ink-600 line-clamp-2">
                  {d?.rationale ? t(d.rationale) : t(meta.desc)}
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-earth-100 flex items-center justify-between gap-3">
                <Link
                  to={`/seller/crop-lots/${lot.public_id || lot._id}`}
                  className="inline-flex items-center text-xs font-bold text-primary-700 hover:text-primary-800 transition"
                >
                  {t("Selling Decision")} →
                </Link>
                <Link
                  to="/seller/demands"
                  className="rounded-xl border border-earth-200 bg-white px-4 py-2 text-xs font-bold text-ink-800 hover:bg-earth-50 hover:border-earth-300 transition"
                >
                  {t("Find Buyers")}
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// 4. Intelligence & Trading Grid (Market Pulse, Offers, FPO)
// ---------------------------------------------------------------------------
function IntelligenceGrid({ crop, snap, offers, fpos }) {
  const { t } = useLanguage()

  return (
    <section className="mt-12 grid gap-8 lg:grid-cols-2">
      {/* 4. Market Pulse */}
      <div className="rounded-3xl border border-earth-200 bg-white p-8 shadow-xs">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-earth-100 pb-6 mb-6">
          <div>
            <p className="ac-section-label font-bold tracking-wider uppercase text-xs text-primary-800">{t("Market Intelligence")}</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-ink-900">
              {t("Market Pulse")}
            </h2>
            <p className="mt-1 text-xs text-ink-500 font-medium">
              {t("Aggregated price trends for")} <span className="font-semibold text-ink-800">{crop}</span>
            </p>
          </div>
          <Link to={`/market-prices/${encodeURIComponent(crop)}`} className="inline-flex items-center gap-1 text-xs font-bold text-primary-700 hover:text-primary-800 transition">
            {t("Full Trends")} →
          </Link>
        </div>

        {snap ? (
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-ink-500">{t("Average Mandi Rate")}</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display text-4xl font-black text-ink-900">
                  ₹{fmtInr2(snap.avg)}
                </span>
                <span className="text-sm font-semibold text-ink-500">/{t("kg")}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 text-right">
              <span className="rounded-full bg-earth-100 px-3 py-1 text-xs font-bold text-ink-800">
                {snap.count} {snap.count === 1 ? t("mandi monitored") : t("mandis monitored")}
              </span>
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
                snap.isLive ? 'border-success-200 bg-success-50 text-success-800' : 'border-honey-200 bg-honey-50 text-honey-800'
              }`}>
                {snap.isLive ? `● ${t("AGMARKNET Live")}` : t("Sample Feed")}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-500">{t("Fetching live mandi prices…")}</p>
        )}
      </div>

      {/* 5. Offers & 6. FPO */}
      <div className="space-y-8">
        {/* Active Offers */}
        <div className="rounded-3xl border border-earth-200 bg-white p-8 shadow-xs">
          <div className="flex items-end justify-between gap-3 border-b border-earth-100 pb-6 mb-6">
            <div>
              <p className="ac-section-label font-bold tracking-wider uppercase text-xs text-primary-800">{t("Direct Trade")}</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-ink-900">
                {offers.length} {t("Active Offers")}
              </h2>
            </div>
            {offers.length > 0 && (
              <Link to="/seller/offers" className="inline-flex items-center gap-1 text-xs font-bold text-primary-700 hover:text-primary-800 transition">
                {t("Review All")} →
              </Link>
            )}
          </div>

          {offers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-earth-300 p-6 text-center">
              <p className="text-sm text-ink-600 font-medium">
                {t("No active buyer offers yet.")}
              </p>
              <Link to="/seller/demands" className="mt-3 inline-block text-xs font-bold text-primary-700 hover:text-primary-800 transition">
                {t("Browse Active Buyer Demands")} →
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {offers.slice(0, 2).map((o) => (
                <Link
                  key={o.public_id || o._id}
                  to={`/seller/offers/${o.public_id}`}
                  className="rounded-2xl border border-earth-200 bg-earth-50/50 p-4 hover:border-primary-300 transition block"
                >
                  <p className="text-xs font-bold text-ink-900 truncate">{o.buyer_name || o.buyer_public_id || t("Verified Buyer")}</p>
                  <p className="text-[11px] text-ink-500 mt-0.5">{t("for")} {o._lot?.crop_name || t("Crop Lot")}</p>
                  <div className="mt-3 flex justify-between items-baseline">
                    <span className="font-display font-bold text-primary-800 text-lg">₹{fmtInr2(o.current_price)}</span>
                    <span className="text-xs font-bold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-md">{t(o.status)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* FPO Network */}
        <div className="rounded-3xl border border-earth-200 bg-white p-8 shadow-xs">
          <div className="flex items-end justify-between gap-3 border-b border-earth-100 pb-6 mb-6">
            <div>
              <p className="ac-section-label font-bold tracking-wider uppercase text-xs text-primary-800">{t("Collective Selling")}</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-ink-900">
                {t("FPO Network")}
              </h2>
            </div>
            <Link to="/fpos" className="inline-flex items-center gap-1 text-xs font-bold text-primary-700 hover:text-primary-800 transition">
              {t("Explore Collectives")} →
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
             {(fpos || []).filter((f) => f.is_member || f.member_count > 0).slice(0, 2).map((f) => (
              <div key={f._id || f.public_id} className="rounded-2xl border border-earth-200 bg-earth-50/50 p-4">
                 <div className="flex justify-between items-start">
                   <h3 className="text-sm font-bold text-ink-900">{f.name}</h3>
                   <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-800">
                     {f.member_count || 12} {t("members")}
                   </span>
                 </div>
                 <p className="mt-1 text-xs text-ink-500">{f.district || f.location || f.state}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Main Dashboard Component
// ---------------------------------------------------------------------------
export default function FarmerDashboard() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const name = useSelector(selectName)
  const lots = useSelector(selectMyLots)
  const lotsStatus = useSelector(selectMyLotsStatus)
  const fpos = useSelector((s) => s.fpos?.list || [])

  usePageMeta({
    title: t('Farmer Selling Workspace'),
    description: t('Decide what to do with your crops, see live mandi prices, and respond to offers — all in one place.'),
  })

  // Load lots & FPOs on mount
  useEffect(() => {
    dispatch(fetchMyCropLots())
    dispatch(fetchFpos())
  }, [dispatch])

  // Load offers for all active lots
  const [offersList, setOffersList] = useState([])
  const [offersStatus, setOffersStatus] = useState('idle')

  useEffect(() => {
    let cancelled = false
    async function loadOffers() {
      if (!lots || lots.length === 0) {
        setOffersList([])
        setOffersStatus('succeeded')
        return
      }
      setOffersStatus('loading')
      const collected = []
      for (const l of lots) {
        try {
          const res = await dispatch(fetchOffers(l._id || l.public_id))
          if (cancelled) return
          if (Array.isArray(res.payload)) {
            for (const o of res.payload) {
              collected.push({ ...o, _lot: l })
            }
          }
        } catch {
          // continue
        }
      }
      if (cancelled) return
      const actionable = collected.filter((o) => o.status === 'OPEN' || o.status === 'COUNTERED')
      setOffersList(actionable)
      setOffersStatus('succeeded')
    }
    loadOffers()
    return () => {
      cancelled = true
    }
  }, [dispatch, lots])

  // Load decisions for each active lot
  const [decisions, setDecisions] = useState({})
  useEffect(() => {
    let cancelled = false
    async function loadDecisions() {
      const out = {}
      for (const l of lots) {
        if (l.status !== 'ACTIVE') continue
        try {
          const res = await api.get(`/decisions/${l.public_id || l._id}`)
          if (cancelled) return
          out[l.public_id || l._id] = res.data
        } catch {
          out[l.public_id || l._id] = null
        }
      }
      if (!cancelled) setDecisions(out)
    }
    if (lots.length) loadDecisions()
    return () => {
      cancelled = true
    }
  }, [lots])

  // Top crop for market pulse
  const topCrop = useMemo(() => {
    const counts = new Map()
    for (const l of lots.filter((l) => l.status === 'ACTIVE')) {
      const k = l.crop_name
      counts.set(k, (counts.get(k) || 0) + 1)
    }
    if (counts.size === 0) return lots[0]?.crop_name || 'Wheat'
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
  }, [lots])

  // Market snapshot query
  const [snap, setSnap] = useState(null)
  useEffect(() => {
    let cancelled = false
    if (!topCrop) return
    api
      .get('/market-prices', { params: { crop: topCrop, limit: 5 } })
      .then((r) => {
        if (cancelled) return
        const arr = r.data?.results || []
        if (arr.length) {
          const modalPrices = arr.map((x) => Number(x.modal_price || 0)).filter(Number.isFinite)
          const avg = modalPrices.length
            ? modalPrices.reduce((a, b) => a + b, 0) / modalPrices.length
            : null
          setSnap({
            avg,
            count: arr.length,
            source: r.data.source,
            isLive: r.data.is_live,
          })
        } else {
          setSnap(null)
        }
      })
      .catch(() => setSnap(null))
    return () => {
      cancelled = true
    }
  }, [topCrop])

  // Select spotlight lot (e.g. lot with SELL_NOW or highest value)
  const spotlightLot = useMemo(() => {
    const active = lots.filter((l) => l.status === 'ACTIVE')
    if (active.length === 0) return null
    // Prioritize lot with SELL_NOW
    const sellNow = active.find((l) => decisions[l.public_id || l._id]?.decision === 'SELL_NOW')
    if (sellNow) return sellNow
    return active[0]
  }, [lots, decisions])

  // Attention strip items
  const counteredCount = offersList.filter((o) => o.status === 'COUNTERED').length
  const openCount = offersList.filter((o) => o.status === 'OPEN').length
  const sellNowCount = lots.filter(
    (l) => l.status === 'ACTIVE' && decisions[l.public_id || l._id]?.decision === 'SELL_NOW'
  ).length

  const attentionItems = [
    counteredCount > 0 && {
      id: 'countered-offers',
      label: t('countered offer(s) need your reply'),
      count: counteredCount,
      tone: 'rust',
      to: '/seller/offers',
    },
    openCount > 0 && {
      id: 'open-offers',
      label: t('open offer(s) from buyers'),
      count: openCount,
      tone: 'primary',
      to: '/seller/offers',
    },
    sellNowCount > 0 && {
      id: 'sell-now',
      label: t('lot(s) in optimal selling window'),
      count: sellNowCount,
      tone: 'honey',
      to: '/seller',
    },
  ].filter(Boolean)

  return (
    <div className="space-y-6">
      {/* 1. Conversational Greeting Hero */}
      <ConversationalHero
        name={name}
        lots={lots}
        offers={offersList}
        decisions={decisions}
      />

      {/* 2. Action Canvas Alert Strip */}
      <AttentionStrip items={attentionItems} />

      {/* 3. Decision Spotlight on Top Lot */}
      {spotlightLot && (
        <DecisionSpotlight
          lot={spotlightLot}
          decisionData={decisions[spotlightLot.public_id || spotlightLot._id]}
          offers={offersList}
        />
      )}

      {/* 4. Active Crop Inventory Pipeline */}
      <PortfolioPipeline lots={lots} decisions={decisions} />

      {/* 5, 6, 7. Intelligence & Trading Grid */}
      <IntelligenceGrid
        crop={topCrop}
        snap={snap}
        offers={offersList}
        fpos={fpos}
      />

      <p className="mt-12 text-center text-xs text-ink-400">
        {t("AgroConnect · Mandi prices from AGMARKNET via data.gov.in · Real-time Decision Engine")}
      </p>
    </div>
  )
}
