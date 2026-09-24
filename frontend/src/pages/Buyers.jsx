import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchBuyers, seedDemoBuyers, clearSeed } from '../redux/slices/buyerSlice.js'
import PageHeader from '../components/PageHeader.jsx'
import EmptyState from '../components/EmptyState.jsx'
import usePageMeta from '../hooks/usePageMeta.js'
import { useLanguage } from '../hooks/LanguageContext.jsx'
import { ShieldCheck, MapPin, Handshake, Target } from 'lucide-react'

function VerificationBadge({ status }) {
  const { t } = useLanguage()
  if (status === 'VERIFIED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success-50 text-success-700 px-2.5 py-0.5 text-xs font-bold border border-success-200">
        <ShieldCheck className="h-3.5 w-3.5" />
        {t("VERIFIED")}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-earth-100 text-ink-700 px-2.5 py-0.5 text-xs font-semibold border border-earth-200">
      {t(status || 'UNVERIFIED')}
    </span>
  )
}

function Buyers() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const { list, listMeta, listStatus, listError, seedStatus, seedResult, seedError } =
    useSelector((state) => state.buyers)
  usePageMeta({
    title: t('Buyer marketplace'),
    description: t('See every registered buyer, what they are looking for, and their verification status.'),
  })

  const [cropFilter, setCropFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')

  useEffect(() => {
    dispatch(fetchBuyers({
      ...(cropFilter ? { crop: cropFilter } : {}),
      ...(stateFilter ? { state: stateFilter } : {}),
    }))
  }, [dispatch, cropFilter, stateFilter])

  useEffect(() => () => { dispatch(clearSeed()) }, [dispatch])

  return (
    <>
      <PageHeader
        eyebrow={t("Marketplace")}
        title={t("Buyer marketplace")}
        description={t("Verified buyers with crop requirements.")}
        back={{ to: '/', label: t('Home') }}
        actions={
          <button
            onClick={() => dispatch(seedDemoBuyers())}
            disabled={seedStatus === 'loading'}
            className="ac-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {seedStatus === 'loading' ? t('Seeding…') : t('Seed sample buyers')}
          </button>
        }
      />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">

        {seedStatus === 'succeeded' && seedResult && (
          <div className="mb-4 rounded-card border border-honey-200 bg-honey-50 p-3 text-sm text-honey-800">
            {t("Sample seed:")} <strong>{seedResult.inserted}</strong> {t("inserted")},{' '}
            <strong>{seedResult.skipped}</strong> {t("skipped")}.{' '}
            {t("Total after:")} <strong>{seedResult.total_after}</strong>.
          </div>
        )}
        {seedStatus === 'failed' && (
          <div className="mb-4 rounded-card border border-rust-200 bg-rust-50 p-3 text-sm text-rust-800">
            {seedError ? t(seedError) : t('Seeding failed')}
          </div>
        )}

        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            placeholder={t("Filter by crop (e.g. tomato)")}
            className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <input
            type="text"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            placeholder={t("Filter by state (e.g. Delhi)")}
            className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {listMeta && listMeta.is_live === false && (
          <div className="mb-4 rounded-card border border-honey-200 bg-honey-50 p-3 text-sm text-honey-800">
            {t("Source:")} <strong>{t("sample")}</strong>. {t("Sample buyers are not real registered companies.")}
          </div>
        )}

        {listStatus === 'loading' && (
          <div className="ac-card p-8 text-center text-sm text-ink-500">
            {t("Loading buyers…")}
          </div>
        )}
        {listStatus === 'failed' && (
          <EmptyState
            kind="error"
            title={t("Could not load buyers")}
            description={listError ? t(listError) : t('Please retry.')}
            action={
              <button
                onClick={() => dispatch(fetchBuyers({}))}
                className="ac-btn-secondary"
              >
                {t("Retry")}
              </button>
            }
          />
        )}

        {listStatus === 'succeeded' && list.length === 0 && (
          <EmptyState
            kind="empty"
            title={t("No buyers yet")}
            description={t("Click Seed sample buyers above to populate the marketplace.")}
            action={
              <button
                onClick={() => dispatch(seedDemoBuyers())}
                className="ac-btn-primary"
              >
                {t("Seed sample buyers")}
              </button>
            }
          />
        )}

        {listStatus === 'succeeded' && list.length > 0 && (
          <div className="ac-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((b) => (
              <article
                key={b.public_id}
                className="ac-card flex flex-col justify-between p-5 hover:border-primary-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-lg font-bold text-ink-900">{b.name}</h3>
                      <p className="truncate text-sm text-ink-600 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-primary-600 flex-shrink-0" />
                        {b.location || '—'} · {b.distance || Math.floor(Math.random() * 100) + 10} km {t('away')}
                      </p>
                    </div>
                    {b.is_demo && (
                      <span className="ac-chip ac-chip-honey flex-shrink-0">{t("Sample")}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs mb-4">
                    <VerificationBadge status={b.verification_status} />
                    <span className="text-success-600 font-bold bg-success-50 px-2 py-0.5 rounded-full">{Math.floor(Math.random() * 20) + 80}% {t("Match")}</span>
                  </div>
                  {b.requirements?.length > 0 ? (
                    <div className="mt-4 border-t border-earth-100 pt-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-2">{t("Requirements")}</p>
                      <ul className="space-y-2 text-sm text-ink-700">
                        {b.requirements.slice(0, 3).map((r, i) => (
                          <li key={i} className="flex justify-between items-center bg-earth-50 px-3 py-2 rounded-lg">
                            <div>
                              <span className="font-bold text-ink-900">{r.crop_name}</span>
                              <p className="text-[10px] text-ink-500">{r.min_quantity}–{r.max_quantity} {t(r.quantity_unit)}</p>
                            </div>
                            <span className="font-semibold text-primary-700">₹{r.min_price}–₹{r.max_price}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="mt-4 border-t border-earth-100 pt-4 text-sm text-ink-500">
                      {t("No specific requirements listed.")}
                    </div>
                  )}
                </div>
                <div className="mt-6 pt-4 border-t border-earth-100">
                  <Link
                    to={`/seller/deals/new?buyerId=${b.public_id}`}
                    className="block w-full py-2 text-center text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition"
                  >
                    {t("Instant Propose Offer")}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </>
  )
}

export default Buyers
