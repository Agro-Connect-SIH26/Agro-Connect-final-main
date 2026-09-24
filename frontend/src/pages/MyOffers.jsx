import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { fetchOffersByBuyer } from '../redux/slices/offerSlice.js'
import { selectActiveBuyer, selectIsBuyer } from '../redux/slices/authSlice.js'
import PageHeader from '../components/PageHeader.jsx'
import EmptyState from '../components/EmptyState.jsx'
import usePageMeta from '../hooks/usePageMeta.js'
import { useLanguage } from '../hooks/LanguageContext.jsx'

const STATUS_STYLES = {
  OPEN: 'bg-honey-100 text-honey-800',
  COUNTERED: 'bg-primary-100 text-primary-800',
  ACCEPTED: 'bg-success-50 text-success-700',
  REJECTED: 'bg-rust-100 text-rust-800',
  FINALIZED: 'bg-success-50 text-success-700',
  CANCELLED: 'bg-earth-200 text-ink-700',
}

function MyOffers() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  usePageMeta({
    title: t('My offers'),
    description: t('Every offer you have placed as a buyer — open, countered, accepted, or rejected.'),
  })
  const isBuyer = useSelector(selectIsBuyer)
  const activeBuyer = useSelector(selectActiveBuyer)
  const { list, listStatus, listError } = useSelector((s) => s.offers)

  useEffect(() => {
    if (!isBuyer) {
      navigate('/role', { replace: true })
    }
  }, [dispatch, isBuyer, navigate])

  useEffect(() => {
    if (activeBuyer?.id) {
      dispatch(fetchOffersByBuyer(activeBuyer.id))
    }
  }, [dispatch, activeBuyer?.id])

  if (!activeBuyer) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="rounded-card border border-honey-200 bg-honey-50 p-6 text-sm text-honey-800">
          {t("No buyer selected.")} <Link to="/buyer" className="font-medium underline">{t("Choose a buyer first")}</Link>.
        </div>
      </main>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow={t("Buying")}
        title={t("My offers")}
        description={`${t("Offers you have placed, as")} ${activeBuyer.name}.`}
        back={{ to: '/buyer', label: t('Back to dashboard') }}
        actions={
          <Link to="/buyer/marketplace" className="ac-btn-primary">
            {t("Browse marketplace")}
          </Link>
        }
      />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">

        {listStatus === 'loading' && (
          <div className="ac-card p-8 text-center text-sm text-ink-500">
            {t("Loading offers…")}
          </div>
        )}
        {listError && (
          <EmptyState
            kind="error"
            title={t("Could not load offers")}
            description={listError ? t(listError) : t('Please retry.')}
            action={
              <button
                onClick={() => dispatch(fetchOffersByBuyer(activeBuyer.id))}
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
            title={t("No offers yet")}
            description={t("Head to the marketplace to place your first offer.")}
            action={
              <Link to="/buyer/marketplace" className="ac-btn-primary">
                {t("Browse marketplace")}
              </Link>
            }
          />
        )}

        {listStatus === 'succeeded' && list.length > 0 && (
          <div className="ac-stagger space-y-3">
            {list.map((o) => (
              <Link
                key={o.public_id}
                to={`/buyer/offers/${o.public_id}`}
                className="ac-card ac-card-hover block p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-ink-500">{t("Offer ID")}</p>
                    <p className="font-mono text-sm text-ink-700">{o.public_id}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[o.status] || 'bg-earth-100 text-ink-700'}`}>
                    {t(o.status)}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-ink-500">{t("Crop Lot")}</p>
                    <p className="font-medium text-ink-900">#{o.crop_lot_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-500">{t("Price")}</p>
                    <p className="font-medium text-ink-900">₹{o.current_price}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-500">{t("Quantity")}</p>
                    <p className="font-medium text-ink-900">{o.current_quantity}</p>
                  </div>
                </div>
                {o.messages?.length > 0 && (
                  <p className="mt-2 text-xs text-ink-500">
                    {o.messages.length} {t("messages")} · {t("last")}{' '}
                    {new Date(o.messages[o.messages.length - 1].created_at).toLocaleString()}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}

export default MyOffers
