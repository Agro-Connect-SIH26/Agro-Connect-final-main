/**
 * components/DecisionCard.jsx — Intelligent 3-Column Selling Decision Workspace.
 *
 * Restructured into a clear comparative view:
 * 1. Lot Specifications & Quality Grade
 * 2. The Net Realization Equation
 * 3. 4-Way Selling Paths (Direct Buyer vs Mandi vs FPO vs Cold Storage)
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchDecision, refreshDecision, clearDecision } from '../redux/slices/decisionSlice.js'
import { fmtInr, fmtInr2, fmtPerKg } from '../utils/format.js'
import { useLanguage } from '../hooks/LanguageContext.jsx'

export default function DecisionCard({ cropLotId, compact = false }) {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const { current, status, error } = useSelector((s) => s.decisions)

  useEffect(() => {
    if (!cropLotId) return
    dispatch(fetchDecision(cropLotId))
    return () => { dispatch(clearDecision()) }
  }, [dispatch, cropLotId])

  if (!cropLotId) return null

  if (status === 'loading' && !current) {
    return (
      <div className="bg-white rounded-2xl border border-earth-200 p-6 animate-pulse">
        <div className="h-6 w-1/3 bg-earth-200 rounded mb-4" />
        <div className="h-20 bg-earth-100 rounded" />
      </div>
    )
  }

  if (status === 'failed' && !current) {
    return (
      <div className="bg-rust-50 border border-rust-200 rounded-2xl p-6 text-rust-800">
        <p className="font-semibold">{t("Unable to calculate decision")}</p>
        <p className="text-sm mt-1">{error || t("Network error occurred")}</p>
        <button
          onClick={() => dispatch(fetchDecision(cropLotId))}
          className="mt-3 px-4 py-1.5 bg-rust-600 text-white rounded-lg text-sm font-medium hover:bg-rust-700"
        >
          {t("Retry")}
        </button>
      </div>
    )
  }

  if (!current) return null

  const bestMarket = (current.market_comparison || [])[0] || null
  const gross = bestMarket?.modal_price ? bestMarket.modal_price * 100 : (current.best_offer_price || 0) * 100
  const logistics = bestMarket?.total_logistics_cost || 0
  const netInHand = bestMarket?.net_realisation || (gross - logistics)

  return (
    <div className="bg-white rounded-3xl border border-earth-200 shadow-sm overflow-hidden mb-8">
      {/* Header Banner */}
      <div className="bg-primary-900 text-white px-6 py-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-primary-300">
            {t("Selling Decision Engine")}
          </span>
          <h2 className="text-xl font-bold mt-1">
            {current.decision === 'SELL_NOW' && t("Recommended Action: Sell Now")}
            {current.decision === 'WAIT' && t("Recommended Action: Hold / Wait")}
            {current.decision === 'GROUP_SALE' && t("Recommended Action: Pool with FPO")}
          </h2>
        </div>
        <button
          onClick={() => dispatch(refreshDecision(cropLotId))}
          className="px-3 py-1.5 rounded-lg bg-primary-800 hover:bg-primary-700 text-xs font-semibold flex items-center gap-1"
        >
          ↻ {t("Recompute Options")}
        </button>
      </div>

      {/* 3-Column Comparative Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-earth-100 p-6 gap-6 lg:gap-0">

        {/* Column 1: Lot Specs */}
        <div className="lg:pr-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-4">
              {t("Lot Specifications")}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm py-1 border-b border-earth-50">
                <span className="text-ink-500">{t("Active Offers")}</span>
                <span className="font-semibold text-ink-900">{current.offer_count || 0}</span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b border-earth-50">
                <span className="text-ink-500">{t("Best Direct Bid")}</span>
                <span className="font-semibold text-primary-700">
                  {current.best_offer_price ? `₹${fmtInr2(current.best_offer_price)}/kg` : t("None")}
                </span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b border-earth-50">
                <span className="text-ink-500">{t("7-Day Market Trend")}</span>
                <span className={`font-semibold ${
                  current.prediction_trend === 'up' ? 'text-success-600' :
                  current.prediction_trend === 'down' ? 'text-rust-600' : 'text-ink-600'
                }`}>
                  {current.prediction_trend === 'up' ? `↑ ${t("Rising")}` :
                   current.prediction_trend === 'down' ? `↓ ${t("Falling")}` : t("Stable")}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-earth-50 rounded-xl p-3 text-xs text-ink-600">
            <span className="font-bold">{t("Rationale")}: </span>
            {current.rationale || t("Computed based on direct bids and regional mandi trends.")}
          </div>
        </div>

        {/* Column 2: Net Realization Equation */}
        <div className="lg:px-6 flex flex-col justify-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-4">
            {t("Net Realization Equation")}
          </h3>

          <div className="bg-earth-50 p-4 rounded-2xl border border-earth-200/60 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-ink-600">{t("Est. Gross Realization")}</span>
              <span className="font-medium text-ink-900">₹{fmtInr(gross)}</span>
            </div>
            <div className="flex justify-between text-sm text-rust-600">
              <span>- {t("Logistics & Transit")}</span>
              <span>₹{fmtInr(logistics)}</span>
            </div>
            <div className="flex justify-between text-sm text-rust-600">
              <span>- {t("Storage & Wastage")}</span>
              <span>₹0</span>
            </div>
            <div className="border-t border-earth-200 pt-3 flex justify-between items-baseline">
              <span className="font-bold text-ink-900">{t("Net In Hand")}</span>
              <span className="text-xl font-extrabold text-success-700">₹{fmtInr(netInHand)}</span>
            </div>
          </div>
        </div>

        {/* Column 3: 4-Way Selling Paths */}
        <div className="lg:pl-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-2">
            {t("Comparative Channels")}
          </h3>

          {/* Path 1: Direct Buyer */}
          <div className="p-2.5 rounded-xl border border-earth-200 hover:border-primary-300 transition flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-ink-900">{t("Direct Buyer Match")}</p>
              <p className="text-[10px] text-ink-500">{t("Zero transport deduction")}</p>
            </div>
            <span className="text-xs font-bold text-primary-700">
              {current.best_offer_price ? `₹${fmtInr2(current.best_offer_price)}/kg` : t("Awaiting bids")}
            </span>
          </div>

          {/* Path 2: Local Mandi */}
          <div className="p-2.5 rounded-xl border border-earth-200 hover:border-primary-300 transition flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-ink-900">{bestMarket?.market || t("Nearest Mandi")}</p>
              <p className="text-[10px] text-ink-500">{bestMarket?.distance_km ? `${bestMarket.distance_km} km away` : t("Estimated mandi net")}</p>
            </div>
            <span className="text-xs font-bold text-ink-900">
              {bestMarket?.modal_price ? `₹${fmtInr2(bestMarket.modal_price)}/kg` : "—"}
            </span>
          </div>

          {/* Path 3: FPO Collective */}
          <div className="p-2.5 rounded-xl border border-earth-200 hover:border-primary-300 transition flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-ink-900">{t("FPO Group Sale")}</p>
              <p className="text-[10px] text-ink-500">{t("Bulk negotiation premium")}</p>
            </div>
            <span className="text-xs font-bold text-primary-600">+5% ~ +8%</span>
          </div>

          {/* Path 4: Cold Storage & Hold */}
          <div className="p-2.5 rounded-xl border border-earth-200 hover:border-primary-300 transition flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-ink-900">{t("Cold Storage & Hold")}</p>
              <p className="text-[10px] text-ink-500">{t("Break-even target")}</p>
            </div>
            <span className="text-xs font-bold text-honey-700">
              {current.breakeven_future_price_per_kg ? `₹${fmtInr2(current.breakeven_future_price_per_kg)}/kg` : "—"}
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}
