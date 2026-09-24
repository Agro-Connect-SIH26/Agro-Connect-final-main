/**
 * DecisionSupport.jsx — rule-based sell-now / wait / store-then-sell
 * advisor for one crop lot.
 *
 * Mounted at /seller/crop-lots/:publicId/decision (and the legacy
 * /farmer/crop-lots/:publicId/decision). The business logic is
 * preserved verbatim — the recommendation badge, the market
 * comparison table, the cold-storage form, the NHB scheme footer.
 * The chrome is the redesigned application shell.
 *
 * Trust signal: every estimate block carries an "ESTIMATE" chip and
 * an explicit "rule-based, not AI" disclaimer. The cold-storage
 * comparison is clearly framed as "sell now vs store then sell" —
 * never as a price forecast.
 */
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { fetchCropLotById } from '../redux/slices/cropLotSlice.js'
import { fetchDecision, refreshDecision } from '../redux/slices/decisionSlice.js'
import { fetchLogisticsConfig } from '../redux/slices/logisticsSlice.js'
import api from '../api/axios.js'
import {
  fmtInr,
  fmtInr2,
  fmtDistanceLabel,
  fmtPerKg,
  NOT_AVAILABLE,
} from '../utils/format.js'
import PageHeader from '../components/PageHeader.jsx'
import CropImage from '../components/CropImage.jsx'
import RecommendationHero from '../components/RecommendationHero.jsx'
import usePageMeta from '../hooks/usePageMeta.js'
import { useLanguage } from '../hooks/LanguageContext.jsx'

const INPUT =
  'w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'

const RECOMMENDATION_TONE = {
  SELL_NOW: 'bg-success-100 text-success-700',
  WAIT: 'bg-honey-100 text-honey-800',
  GROUP_SALE: 'bg-primary-100 text-primary-800',
}

const RECOMMENDATION_LABEL = {
  SELL_NOW: 'Sell now',
  WAIT: 'Wait',
  GROUP_SALE: 'Group sale',
}

function RecommendationBadge({ rec }) {
  const { t } = useLanguage()
  const tone = RECOMMENDATION_TONE[rec] || 'bg-ink-100 text-ink-700'
  const label = t(RECOMMENDATION_LABEL[rec] || rec)
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider bg-primary-100 text-primary-800 border border-primary-200">
      {label}
    </span>
  )
}

function sourceLabelForRow(row, t) {
  if (row.is_routed && row.distance_provider === 'geoapify') {
    return t('Road distance · Geoapify')
  }
  if (row.is_routed && row.distance_provider === 'osrm') {
    return t('Road distance · OSRM')
  }
  if (row.origin_kind === 'state' || row.origin_kind === 'district') {
    return `${t('Estimated')} (${row.origin_kind}-centroid)`
  }
  if (row.origin_kind === 'geocoded') {
    return t('Road distance · geocoded')
  }
  return t('Estimated (haversine)')
}

function DecisionSupport() {
  const { t } = useLanguage()
  const { publicId } = useParams()
  const dispatch = useDispatch()
  usePageMeta({
    title: t('Decision support'),
    description: t('Rule-based sell-now / wait / store-then-sell recommendation. Not an AI prediction. Estimate only.'),
  })
  const { currentLot } = useSelector((state) =>
    state.cropLots.currentLot && state.cropLots.currentLot.public_id === publicId
      ? { currentLot: state.cropLots.currentLot }
      : { currentLot: null }
  )
  const { current, status, error } = useSelector((state) => state.decisions)
  const { config: logisticsConfig } = useSelector((state) => state.logistics)

  const [coldDays, setColdDays] = useState(30)
  const [coldRate, setColdRate] = useState(0.2)
  const [coldEstimate, setColdEstimate] = useState(null)
  const [coldLoading, setColdLoading] = useState(false)
  const [coldError, setColdError] = useState(null)

  useEffect(() => {
    if (publicId) {
      dispatch(fetchCropLotById(publicId)).then((action) => {
        if (action.meta.requestStatus === 'fulfilled') {
          dispatch(fetchDecision(action.payload.id))
          const got = action.payload
          if (got) {
            if (got.cold_storage_duration_days > 0)
              setColdDays(got.cold_storage_duration_days)
            if (got.cold_storage_rate_per_kg_per_day > 0)
              setColdRate(got.cold_storage_rate_per_kg_per_day)
          }
        }
      })
    }
  }, [dispatch, publicId])

  useEffect(() => {
    if (!logisticsConfig) dispatch(fetchLogisticsConfig())
  }, [dispatch, logisticsConfig])

  const runColdEstimate = async () => {
    if (!publicId) return
    setColdLoading(true)
    setColdError(null)
    try {
      const res = await api.post('/cold-storage/estimate', {
        crop_lot_id: publicId,
        days: Number(coldDays),
        rate_per_kg_per_day: Number(coldRate),
      })
      setColdEstimate(res.data)
    } catch (err) {
      setColdError(err.response?.data?.detail || err.message)
    } finally {
      setColdLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={currentLot ? currentLot.crop_name : t('Selling')}
        title={t("Decision support")}
        subtitle={
          currentLot
            ? `${t('Rule-based recommendation for')} ${currentLot.crop_name} · ${currentLot.quantity} ${currentLot.quantity_unit}. ${t('Not an AI prediction. Estimate only.')}`
            : t('Rule-based recommendation. Not an AI prediction. Estimate only.')
        }
        back={{ to: `/seller/crop-lots/${publicId}`, label: t('Back to lot') }}
        actions={
          <Link
            to={`/seller/crop-lots/${publicId}/opportunities`}
            className="ac-btn-secondary"
          >
            {t("Opportunities")}
          </Link>
        }
      />

      {currentLot && (
        <div className="ac-card mb-6 flex items-center gap-4 p-4">
          <CropImage
            crop={currentLot.crop_name}
            label={currentLot.crop_name}
            className="h-14 w-14 flex-shrink-0 rounded-lg"
          />
          <div className="min-w-0">
            <p className="truncate font-display text-base text-ink-900">
              {currentLot.crop_name}
              {currentLot.crop_variety ? ` · ${currentLot.crop_variety}` : ''}
            </p>
            <p className="truncate text-xs text-ink-500">
              {currentLot.location || '—'} · {currentLot.quantity}{' '}
              {currentLot.quantity_unit}
            </p>
          </div>
        </div>
      )}

      {status === 'loading' && (
        <div className="ac-card p-8 text-center text-sm text-ink-500">
          {t("Computing decision…")}
        </div>
      )}
      {status === 'failed' && (
        <div className="mb-4 rounded-card border border-rust-200 bg-rust-50 p-4 text-sm text-rust-800">
          {error}
        </div>
      )}

      {status === 'succeeded' && current && (
        <div className="space-y-6">
          <RecommendationHero
            rec={current.recommendation}
            reason={current.reason}
            insufficient={current.insufficient_data}
          />

          <section className="ac-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg text-ink-900">{t("Why this recommendation?")}</h2>
              <button
                onClick={() => dispatch(refreshDecision(current.crop_lot_id))}
                className="text-sm font-medium text-primary-700 transition hover:text-primary-800"
              >
                ↻ {t("Recompute")}
              </button>
            </div>
            <p className="mt-3 text-sm text-ink-800">{current.reason || NOT_AVAILABLE}</p>
          </section>

          {current.comparison?.length > 0 && (
            <section className="ac-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                <h2 className="font-display text-lg font-bold text-ink-900">
                  {t("Market Comparison")}
                </h2>
                <span
                  className="ac-chip ac-chip-ink text-xs"
                  title={t("Distances use the configured routing provider... Logistical costs are rule-based.")}
                >
                  {t("Distances")}: {current.comparison.some((r) => r.is_routed) ? t('road (routed)') : t('estimated')}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {current.comparison.map((row, i) => {
                  const dist = fmtDistanceLabel(row)
                  return (
                    <div key={i} className="rounded-2xl border border-earth-200 bg-white p-5 shadow-xs hover:border-primary-300 transition">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-bold text-ink-900">{row.market || NOT_AVAILABLE}</p>
                          <p className="text-xs text-ink-500">{row.state || row.location || ''}</p>
                        </div>
                        <p className="text-lg font-black text-ink-900">{fmtPerKg(row.modal_price)}</p>
                      </div>

                      <div className="space-y-2 text-xs text-ink-600">
                        <div className="flex justify-between"><span>{t("Distance")}:</span> <span className="font-medium text-ink-900">{dist.text}</span></div>
                        <div className="flex justify-between"><span>{t("Transport")}:</span> <span className="font-medium text-ink-900">₹{fmtInr(row.transport_cost)}</span></div>
                        <div className="flex justify-between border-t border-earth-100 pt-2 mt-2">
                           <span className="font-semibold text-ink-900">{t("Net Realization")}:</span>
                           <span className="font-bold text-success-700">₹{fmtInr(row.net_realisation)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          <section className="ac-card p-8 border border-primary-100 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="font-display text-2xl font-bold text-ink-900">
                  {t("Cold Storage Comparison")}
                </h2>
                <p className="mt-1 text-sm text-ink-600">
                  {t("Compare the net realization of selling now versus storing using a cold-storage facility.")}
                </p>
                <p className="mt-2 text-xs text-honey-800 font-medium">
                  {t("⚠ Illustrative comparison only. Prices are based on current estimates.")}
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3 bg-earth-50 rounded-2xl p-6 border border-earth-100">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-ink-600">
                  {t("Storage Duration")}
                </label>
                <div className="flex items-center gap-2">
                   <input
                    type="number"
                    min="1"
                    max="365"
                    value={coldDays}
                    onChange={(e) => setColdDays(e.target.value)}
                    className="w-full rounded-xl border border-earth-200 bg-white px-4 py-3 text-sm shadow-xs focus:ring-2 focus:ring-primary-200"
                  />
                  <span className="text-sm font-medium text-ink-600">{t("days")}</span>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-ink-600">
                  {t("Rate (₹/kg/day)")}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={coldRate}
                  onChange={(e) => setColdRate(e.target.value)}
                  className="w-full rounded-xl border border-earth-200 bg-white px-4 py-3 text-sm shadow-xs focus:ring-2 focus:ring-primary-200"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={runColdEstimate}
                  disabled={coldLoading}
                  className="w-full rounded-xl bg-primary-700 py-3 text-sm font-bold text-white transition hover:bg-primary-800 shadow-sm disabled:opacity-50"
                >
                  {coldLoading ? t('Computing…') : t('Compare Scenarios')}
                </button>
              </div>
            </div>

            {coldError && (
              <p className="mt-4 text-sm text-rust-700 font-medium">{coldError}</p>
            )}

            {coldEstimate && (
              <div className="mt-8 rounded-2xl border border-primary-200 bg-primary-50/50 p-6">
                <div className="grid gap-8 sm:grid-cols-2">
                  <div className="p-4 bg-white rounded-xl shadow-xs border border-primary-100">
                    <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">
                      {t("Sell Now")}
                    </p>
                    <p className="font-display text-3xl font-black text-ink-900">
                      {fmtInr(coldEstimate.sell_now_value)}
                    </p>
                    <p className="text-xs font-medium text-ink-600 mt-1">
                      @ {fmtPerKg(coldEstimate.sell_now_price_per_kg)}
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-xl shadow-xs border border-success-200">
                    <p className="text-xs font-bold uppercase tracking-wider text-success-800 mb-2">
                      {t("Store then Sell")}
                    </p>
                    <p className="font-display text-3xl font-black text-success-700">
                      {fmtInr(coldEstimate.net_store_then_sell)}
                    </p>
                    <p className="text-xs font-medium text-ink-600 mt-1">
                      @ {fmtPerKg(coldEstimate.store_then_sell_price_per_kg)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium text-ink-700 bg-white p-4 rounded-xl border border-earth-100">
                  <div>{t("Storage cost")}: <span className="font-bold text-ink-900">{fmtInr(coldEstimate.storage_cost)}</span></div>
                  <div>{t("Wastage")}: <span className="font-bold text-ink-900">{fmtInr(coldEstimate.wastage_value)}</span></div>
                  <div>{t("Net Advantage")}: <span className="font-bold text-primary-800">{fmtInr(coldEstimate.delta_vs_sell_now)}</span></div>
                </div>

                <div className="mt-6 rounded-xl border border-primary-200 bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary-900 mb-2">
                    {t("Recommendation")}
                  </p>
                  <p className="font-bold text-lg text-primary-800">
                    {coldEstimate.recommendation || 'NEUTRAL'}
                  </p>
                  <p className="mt-2 text-sm text-ink-700 leading-relaxed">
                    {coldEstimate.rationale || NOT_AVAILABLE}
                  </p>
                </div>
              </div>
            )}
          </section>

          <div>
            <Link
              to={`/seller/crop-lots/${publicId}/buyers`}
              className="text-sm font-medium text-primary-700 transition hover:text-primary-800"
            >
              {t("See matched buyers →")}
            </Link>
          </div>
        </div>
      )}
    </>
  )
}

export default DecisionSupport
