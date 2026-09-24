/**
 * BuyerDashboard.jsx — buyer's home screen.
 *
 * The page is laid out in order of what a buyer most often needs to
 * do when they land here:
 *
 *   1.  Active-buyer hero        — the greeting, the active buyer
 *                                  identity, and one primary action.
 *                                  If no buyer is picked, this is the
 *                                  BuyerPicker (seed + choose).
 *   2.  Stat row                 — active demands, open offers,
 *                                  deals in progress, lifetime
 *                                  purchase value.
 *   3.  Prioritized quick-actions — the four most common next steps,
 *                                  each as a card. The primary
 *                                  "browse marketplace" sits first.
 *   4.  Demands block            — own demands, with a create CTA.
 *   5.  Offers & deals snapshots — last 5 each, side by side.
 *
 * The previous version had a "tile grid" that listed every route and
 * a redundant CTA strip. Both are gone: the new design is a
 * prioritized "what now" view, in the same shape as the Farmer
 * dashboard.
 *
 * All Redux dispatches and business logic are preserved verbatim
 * (the `require('../redux/slices/demandSlice.js').removeRequirement`
 * runtime require is the deliberate escape hatch we keep).
 */
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import {
  fetchBuyers,
  seedDemoBuyers,
  clearSeed,
} from '../redux/slices/buyerSlice.js'
import {
  fetchOffersByBuyer,
  clearCurrentOffer,
} from '../redux/slices/offerSlice.js'
import { fetchEnrichedDealsForBuyer } from '../redux/slices/dealSlice.js'
import {
  selectActiveBuyer,
  setActiveBuyer,
  selectIsBuyer,
} from '../redux/slices/authSlice.js'
import {
  fetchBuyerRequirements,
  clearAction,
} from '../redux/slices/demandSlice.js'
import PageHeader from '../components/PageHeader.jsx'
import EmptyState from '../components/EmptyState.jsx'
import StatCard from '../components/StatCard.jsx'
import AttentionStrip from '../components/AttentionStrip.jsx'
import BuyerDecisionSpotlight from '../components/BuyerDecisionSpotlight.jsx'
import usePageMeta from '../hooks/usePageMeta.js'
import { fmtInr, fmtInr2 } from '../utils/format.js'
import { useLanguage } from '../hooks/LanguageContext.jsx'

const INPUT =
  'w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'

const OFFER_STATUS_TONE = {
  OPEN: 'bg-primary-100 text-primary-800',
  COUNTERED: 'bg-honey-100 text-honey-800',
  ACCEPTED: 'bg-success-100 text-success-700',
  REJECTED: 'bg-rust-100 text-rust-800',
  FINALIZED: 'bg-primary-100 text-primary-800',
  CANCELLED: 'bg-ink-100 text-ink-700',
}

function OfferStatusPill({ status }) {
  const { t } = useLanguage()
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        OFFER_STATUS_TONE[status] || 'bg-ink-100 text-ink-700'
      }`}
    >
      {t(status)}
    </span>
  )
}

function useGreeting() {
  const { t } = useLanguage()
  const hour = new Date().getHours()
  if (hour < 12) return t('Good morning')
  if (hour < 17) return t('Good afternoon')
  return t('Good evening')
}

// ---- BuyerPicker (first-time flow) -----------------------------------

function BuyerPicker() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const {
    list,
    listStatus,
    listError,
    seedStatus,
    seedResult,
    seedError,
  } = useSelector((s) => s.buyers)
  const [selectedId, setSelectedId] = useState('')

  useEffect(() => {
    if (listStatus === 'idle') dispatch(fetchBuyers({}))
  }, [dispatch, listStatus])

  useEffect(() => () => {
    dispatch(clearSeed())
  }, [dispatch])

  const confirm = () => {
    const buyer = list.find((b) => String(b.id) === String(selectedId))
    if (!buyer) return
    dispatch(setActiveBuyer(buyer))
    navigate('/buyer', { replace: true })
  }

  return (
    <section className="ac-card p-5">
      <p className="ac-section-label">{t("Choose buyer")}</p>
      <h2 className="mt-1 font-display text-2xl text-ink-900">
        {t("Which buyer are you?")}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-ink-600">
        {t("Pick which sample buyer identity to use — this scopes the offers and deals you see on the rest of the dashboard. You can switch later from the dashboard.")}
      </p>

      {listStatus === 'loading' && (
        <p className="mt-3 text-sm text-ink-500">{t("Loading buyers…")}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => dispatch(seedDemoBuyers())}
          disabled={seedStatus === 'loading' || list.length > 0}
          className="ac-btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {seedStatus === 'loading' ? t('Seeding…') : t('Seed sample buyers')}
        </button>
        {list.length === 0 && (
          <span className="text-xs text-ink-500">
            {t("No buyers yet — click")} <em>{t("Seed sample buyers")}</em> {t("to add 6 sample buyers.")}
          </span>
        )}
      </div>

      {seedStatus === 'succeeded' && seedResult && (
        <div className="mt-3 rounded-card border border-honey-200 bg-honey-50 p-3 text-sm text-honey-800">
          {t("Seeded")} {seedResult.inserted} {t("sample buyers. Sample data is clearly labelled.")}
        </div>
      )}
      {seedError && (
        <div className="mt-3 rounded-card border border-rust-200 bg-rust-50 p-3 text-sm text-rust-800">
          {seedError}
        </div>
      )}

      {list.length > 0 && (
        <div className="mt-4">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className={INPUT}
            aria-label={t("Choose buyer identity")}
          >
            <option value="">{t("— Select a buyer —")}</option>
            {list.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.is_demo ? `· ${t('sample')}` : ''}{' '}
                {b.location ? `· ${b.location}` : ''}
              </option>
            ))}
          </select>
          <button
            onClick={confirm}
            disabled={!selectedId}
            className="ac-btn-primary mt-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("Continue as this buyer →")}
          </button>
        </div>
      )}

      {listError && <p className="mt-3 text-sm text-rust-700">{listError}</p>}
    </section>
  )
}

import { ShoppingBag, Search, PlusCircle, RotateCcw, Truck, DollarSign, Clock, ArrowRight, CheckCircle2 } from 'lucide-react'

// ---- Hero + stat row --------------------------------------------------

function BuyerHero({ activeBuyer, onSwitch }) {
  const { t } = useLanguage()
  const greeting = useGreeting()
  return (
    <div className="rounded-3xl border border-earth-200 bg-gradient-to-r from-primary-900 via-primary-800 to-earth-900 p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-semibold text-primary-100 border border-white/10">
            <ShoppingBag className="h-3.5 w-3.5 text-primary-300" />
            {t("Verified Procurement Portal")}
          </span>
          {activeBuyer && (
            <span className="text-xs font-semibold text-primary-200 bg-black/20 px-3 py-1 rounded-full border border-white/5">
              {activeBuyer.location || 'Pan-India'}
            </span>
          )}
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl text-white">
          {greeting}{activeBuyer?.name ? `, ${activeBuyer.name}` : ''}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-primary-100/90 leading-relaxed">
          {t("Direct farm-to-enterprise procurement workspace. Source live lots with transparent quality grading, escrow payments, and routed logistics.")}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link to="/buyer/marketplace" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-primary-950 transition hover:bg-earth-100 shadow-sm">
            <Search className="h-4 w-4 text-primary-800" />
            {t("Browse Marketplace")}
          </Link>
          <Link to="/buyer/demands/new" className="inline-flex items-center gap-2 rounded-xl bg-primary-700/80 border border-primary-500/40 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-600/80 backdrop-blur-sm">
            <PlusCircle className="h-4 w-4" />
            {t("Publish Demand")}
          </Link>
          {activeBuyer && (
            <button onClick={onSwitch} className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20 border border-white/10">
              <RotateCcw className="h-3.5 w-3.5" />
              {t("Switch Identity")}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function BuyerStatRow({ demands, offers, deals }) {
  const { t } = useLanguage()
  const activeDemands = demands.filter(
    (d) => d.status === 'ACTIVE' || d.status === 'PENDING' || !d.status
  ).length
  const openOffers = offers.filter(
    (o) => o.status === 'OPEN' || o.status === 'COUNTERED'
  ).length
  const dealsInProgress = deals.filter(
    (d) => d.delivery_status !== 'COMPLETED' && d.delivery_status !== 'DELIVERED'
  ).length
  const lifetimeValue = deals.reduce(
    (a, d) => a + Number(d.total_value || 0),
    0
  )
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label={t("Active demands")}
        value={activeDemands}
        hint={activeDemands > 0 ? t('Visible to farmers') : t('No demands yet')}
        tone={activeDemands > 0 ? 'primary' : 'default'}
        icon={
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M3 7h18l-1.5 12a2 2 0 0 1-2 1.8H6.5a2 2 0 0 1-2-1.8L3 7Z" />
            <path d="M8 7V5a4 4 0 0 1 8 0v2" />
          </svg>
        }
      />
      <StatCard
        label={t("Open offers")}
        value={openOffers}
        hint={openOffers > 0 ? t('Negotiating') : t('No open offers')}
        tone={openOffers > 0 ? 'primary' : 'default'}
        icon={
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M21 12a9 9 0 1 1-3.5-7.1" />
            <path d="M21 4v5h-5" />
          </svg>
        }
      />
      <StatCard
        label={t("Deals in progress")}
        value={dealsInProgress}
        hint={dealsInProgress > 0 ? t('Track delivery') : t('Nothing moving')}
        icon={
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M3 7h11v8H3z" />
            <path d="M14 10h4l3 3v2h-7" />
            <circle cx="7" cy="17" r="2" />
            <circle cx="17" cy="17" r="2" />
          </svg>
        }
      />
      <StatCard
        label={t("Lifetime purchases")}
        value={`₹${fmtInr(lifetimeValue)}`}
        hint={t("Across all deals")}
        icon={
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M12 2v20" />
            <path d="M17 6H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H7" />
          </svg>
        }
      />
    </div>
  )
}

// ---- Quick actions grid -----------------------------------------------

const QUICK_ACTIONS = [
  {
    to: '/buyer/marketplace',
    title: 'Browse marketplace',
    blurb: 'See every ACTIVE crop lot from farmers and make offers.',
    tone: 'primary',
  },
  {
    to: '/buyer/demands/new',
    title: 'Create a demand',
    blurb: 'Tell farmers what you want — crop, quantity, price, location.',
    tone: 'honey',
  },
  {
    to: '/buyer/offers',
    title: 'My offers',
    blurb: 'Track every offer you have placed — open, countered, accepted.',
    tone: 'default',
  },
  {
    to: '/buyer/deals',
    title: 'My purchases',
    blurb: 'Track delivery and payment for every deal you are buying.',
    tone: 'default',
  },
]

function QuickActions() {
  const { t } = useLanguage()
  return (
    <section className="mt-8">
      <p className="ac-section-label">{t("What now?")}</p>
      <h2 className="mt-1 font-display text-2xl text-ink-900">
        {t("Pick what you want to do next")}
      </h2>
      <div className="ac-stagger mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_ACTIONS.map((a) => {
          const border =
            a.tone === 'honey'
              ? 'border-honey-300'
              : a.tone === 'primary'
                ? 'border-primary-200'
                : 'border-earth-200'
          return (
            <Link
              key={a.to}
              to={a.to}
              className={`ac-card ac-card-hover block p-5 ${border}`}
            >
              <h3 className="font-display text-lg text-ink-900">
                {t(a.title)}
              </h3>
              <p className="mt-1 text-sm text-ink-600">{t(a.blurb)}</p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

// ---- Demands card -----------------------------------------------------

function MyDemandsCard({ buyerPublicId }) {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const {
    buyerReqs,
    buyerReqsStatus,
    buyerReqsError,
    actionStatus,
    actionError,
  } = useSelector((s) => s.demands)

  useEffect(() => {
    if (buyerPublicId) dispatch(fetchBuyerRequirements(buyerPublicId))
    return () => {
      dispatch(clearAction())
    }
  }, [dispatch, buyerPublicId])

  const remove = (idx) => {
    if (!buyerPublicId) return
    if (!window.confirm(t('Remove this demand?'))) return
    dispatch(
      // eslint-disable-next-line no-undef
      require('../redux/slices/demandSlice.js').removeRequirement({
        publicId: buyerPublicId,
        index: idx,
      })
    ).then((a) => {
      if (a.meta.requestStatus === 'fulfilled' && buyerPublicId) {
        dispatch(fetchBuyerRequirements(buyerPublicId))
      }
    })
  }

  return (
    <section className="ac-card mt-8 p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="ac-section-label">{t("My demands")}</p>
        <Link to="/buyer/demands/new" className="ac-btn-secondary">
          {t("+ Create demand")}
        </Link>
      </div>
      {buyerReqsStatus === 'loading' && (
        <p className="text-sm text-ink-500">{t("Loading…")}</p>
      )}
      {buyerReqsError && (
        <p className="text-sm text-rust-700">{buyerReqsError}</p>
      )}
      {actionError && (
        <p className="mt-2 text-sm text-rust-700">{actionError}</p>
      )}
      {buyerReqsStatus === 'succeeded' && buyerReqs.length === 0 && (
        <EmptyState
          kind="info"
          title={t("No demands yet")}
          description={t("Tell farmers what you want to buy and they'll see your demand on the marketplace. Click Create demand above.")}
          action={
            <Link to="/buyer/demands/new" className="ac-btn-primary">
              {t("+ Create demand")}
            </Link>
          }
        />
      )}
      {buyerReqsStatus === 'succeeded' && buyerReqs.length > 0 && (
        <ul className="divide-y divide-ink-100">
          {buyerReqs.map((r, i) => (
            <li key={i} className="py-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-medium text-ink-900">
                    {r.crop_name}
                  </span>
                  {r.crop_variety ? ` · ${r.crop_variety}` : ''}{' '}
                  <span className="text-ink-600">· ≥{r.min_quantity_kg} {t('kg')}</span>
                  {r.max_price_per_kg != null && (
                    <span className="text-ink-600">
                      {' '}
                      · ≤₹{r.max_price_per_kg}/{t('kg')}
                    </span>
                  )}
                  {r.required_date && (
                    <span className="text-ink-600">
                      {' '}
                      · {t('by')} {r.required_date}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => remove(i)}
                  disabled={actionStatus === 'loading'}
                  className="rounded-full border border-rust-200 px-2 py-0.5 text-xs font-medium text-rust-700 transition hover:bg-rust-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("remove")}
                </button>
              </div>
              {(r.location || r.notes) && (
                <p className="mt-1 text-xs text-ink-500">
                  {[r.location, r.notes].filter(Boolean).join(' · ')}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ---- Activity snapshots ----------------------------------------------

function ActivitySnapshots({ offers, deals, offerStatus, dealStatus, offerError, dealError }) {
  const { t } = useLanguage()
  return (
    <section className="mt-8">
      <p className="ac-section-label">{t("Activity")}</p>
      <h2 className="mt-1 font-display text-2xl text-ink-900">
        {t("What's happening with your buying")}
      </h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="ac-card p-5">
          <p className="ac-section-label">{t("Recent offers")}</p>
          {offerStatus === 'loading' && (
            <p className="mt-3 text-sm text-ink-500">{t("Loading…")}</p>
          )}
          {offerError && <p className="mt-3 text-sm text-rust-700">{offerError}</p>}
          {offerStatus === 'succeeded' && (
            <ul className="mt-3 divide-y divide-ink-100">
              {offers.slice(0, 5).map((o) => (
                <li key={o.public_id} className="py-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-ink-900">
                      ₹{fmtInr2(o.current_price)}{' '}
                      <span className="text-ink-500">
                        · {t("qty")} {o.current_quantity}
                      </span>
                    </span>
                    <OfferStatusPill status={o.status} />
                  </div>
                  <Link
                    to={`/buyer/offers/${o.public_id}`}
                    className="text-xs text-primary-700 hover:underline"
                  >
                    {t("open")}
                  </Link>
                </li>
              ))}
              {offers.length === 0 && (
                <li className="py-3 text-sm text-ink-600">{t("No offers yet.")}</li>
              )}
            </ul>
          )}
          <div className="mt-3 border-t border-earth-100 pt-3">
            <Link to="/buyer/offers" className="ac-btn-ghost text-xs">
              {t("All offers →")}
            </Link>
          </div>
        </article>

        <article className="ac-card p-5">
          <p className="ac-section-label">{t("Recent deals")}</p>
          {dealStatus === 'loading' && (
            <p className="mt-3 text-sm text-ink-500">{t("Loading…")}</p>
          )}
          {dealError && <p className="mt-3 text-sm text-rust-700">{dealError}</p>}
          {dealStatus === 'succeeded' && (
            <ul className="mt-3 divide-y divide-ink-100">
              {deals.slice(0, 5).map((d) => (
                <li key={d.public_id} className="py-2 text-sm">
                  <div className="font-medium text-ink-900">
                    {d.crop_lot?.crop_name || t('Crop')}{' '}
                    {d.crop_lot?.quantity
                      ? `· ${d.crop_lot.quantity}${
                          t(d.crop_lot.quantity_unit || 'kg')
                        }`
                      : ''}
                  </div>
                  <div className="mt-0.5 text-xs text-ink-600">
                    ₹{fmtInr(Number(d.total_value || 0))} ·{' '}
                    {t(d.delivery_status)} · {t("pay")} {t(d.payment_status)}
                  </div>
                  <Link
                    to={`/buyer/deals/${d.public_id}`}
                    className="text-xs text-primary-700 hover:underline"
                  >
                    {t("open deal")}
                  </Link>
                </li>
              ))}
              {deals.length === 0 && (
                <li className="py-3 text-sm text-ink-600">{t("No deals yet.")}</li>
              )}
            </ul>
          )}
          <div className="mt-3 border-t border-earth-100 pt-3">
            <Link to="/buyer/deals" className="ac-btn-ghost text-xs">
              {t("All purchases →")}
            </Link>
          </div>
        </article>
      </div>
    </section>
  )
}

// ---- Main component ---------------------------------------------------

function BuyerDashboardInner() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const activeBuyer = useSelector(selectActiveBuyer)
  const { list: myOffers, listStatus: offerStatus, listError: offerError } =
    useSelector((s) => s.offers)
  const { enrichedList: myDeals, enrichedListStatus, enrichedListError } =
    useSelector((s) => s.deals)
  const { buyerReqs } = useSelector((s) => s.demands)

  useEffect(() => {
    if (activeBuyer?.id) {
      dispatch(fetchOffersByBuyer(activeBuyer.id))
      dispatch(fetchEnrichedDealsForBuyer(activeBuyer.id))
    }
    return () => {
      dispatch(clearCurrentOffer())
    }
  }, [dispatch, activeBuyer?.id])

  if (!activeBuyer?.id) return <BuyerPicker />

  // Attention items: actionable counts the dashboard already loads.
  // - countered offers need a buyer reply
  // - open offers are still on the table
  // - deals awaiting delivery (PREPARING / IN_TRANSIT) need attention
  const counteredCount = (myOffers || []).filter((o) => o.status === 'COUNTERED').length
  const openCount = (myOffers || []).filter((o) => o.status === 'OPEN').length
  const dealsInTransit = (myDeals || []).filter(
    (d) => d.delivery_status === 'PREPARING' || d.delivery_status === 'IN_TRANSIT'
  ).length
  const attentionItems = [
    counteredCount > 0 && {
      id: 'countered-offers',
      label: t('countered offer(s) need your reply'),
      count: counteredCount,
      tone: 'rust',
      to: '/buyer/offers',
    },
    openCount > 0 && {
      id: 'open-offers',
      label: t('open offer(s) awaiting farmer'),
      count: openCount,
      tone: 'primary',
      to: '/buyer/offers',
    },
    dealsInTransit > 0 && {
      id: 'deals-in-transit',
      label: t('deal(s) in transit'),
      count: dealsInTransit,
      tone: 'honey',
      to: '/buyer/deals',
    },
  ].filter(Boolean)

  return (
    <div>
      <BuyerHero
        activeBuyer={activeBuyer}
        onSwitch={() => dispatch(setActiveBuyer(null))}
      />
      <AttentionStrip items={attentionItems} />
      <BuyerStatRow
        demands={buyerReqs || []}
        offers={myOffers || []}
        deals={myDeals || []}
      />
      <BuyerDecisionSpotlight
        demands={buyerReqs || []}
        activeBuyer={activeBuyer}
      />
      <QuickActions />
      <MyDemandsCard buyerPublicId={activeBuyer.public_id} />
      <ActivitySnapshots
        offers={myOffers || []}
        deals={myDeals || []}
        offerStatus={offerStatus}
        dealStatus={enrichedListStatus}
        offerError={offerError}
        dealError={enrichedListError}
      />
    </div>
  )
}

function BuyerDashboard() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const isBuyer = useSelector(selectIsBuyer)
  usePageMeta({
    title: 'Buyer dashboard',
    description: 'Browse produce, publish demands, place offers, and track purchases in one place.',
  })

  useEffect(() => {
    if (!isBuyer) {
      navigate('/role', { replace: true })
    }
  }, [isBuyer, navigate])

  return (
    <>
      <PageHeader
        eyebrow={t("Buying")}
        title={t("Buyer dashboard")}
        description={t("Browse produce, publish demands, place offers, and track purchases.")}
      />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <BuyerDashboardInner />
      </main>
    </>
  )
}

export default BuyerDashboard
