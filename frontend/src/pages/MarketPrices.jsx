import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchMarketPrices,
  fetchMarketPriceHistory,
  fetchMarketPricePrediction,
  resetFilters,
  setFilter,
} from '../redux/slices/marketPriceSlice.js'
import { fmtInr } from '../utils/format.js'
import PageHeader from '../components/PageHeader.jsx'
import PriceTrendChart from '../components/PriceTrendChart.jsx'
import MandiMap from '../components/MandiMap.jsx'
import SearchableSelect from '../components/SearchableSelect.jsx'
import MarketPulseSnapshot from '../components/MarketPulseSnapshot.jsx'
import usePageMeta from '../hooks/usePageMeta.js'
import api from '../api/axios.js'
import { useLanguage } from '../hooks/LanguageContext.jsx'
import { Search, RotateCcw, Table as TableIcon } from 'lucide-react'

const FIELD_CLASS = 'block w-full rounded-xl border border-earth-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch (e) {
    return String(iso).split('T')[0]
  }
}

function LiveBadge({ isLive, source }) {
  const { t } = useLanguage()
  if (isLive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 text-success-700 px-3 py-1 text-xs font-bold border border-success-200">
        <span className="h-2 w-2 rounded-full bg-success-500 animate-pulse" />
        {t("Live")} · {t(source || 'AGMARKNET')}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-honey-50 text-honey-800 px-3 py-1 text-xs font-bold border border-honey-200">
      <span className="h-2 w-2 rounded-full bg-honey-500" />
      {t("Sample data")}
    </span>
  )
}

function MarketPrices() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const { list, listStatus, filters } = useSelector(
    (state) => state.marketPrices
  )

  usePageMeta({
    title: t('Market Prices'),
    description: t('Current AGMARKNET prices, history, and projections for crops across India.'),
  })

  const [metadata, setMetadata] = useState({ crops: [], states: [], districts: [] })
  const [metadataStatus, setMetadataStatus] = useState('idle')

  const [selectedCrop, setSelectedCrop] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [selectedMarket, setSelectedMarket] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')

  const [hasSearched, setHasSearched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    setMetadataStatus('loading')
    setMetadata({ crops: [], states: [], districts: [] })
    setSelectedState('')
    setSelectedDistrict('')
    api
      .get('/market-prices/metadata')
      .then((r) => {
        if (cancelled) return
        setMetadata((prev) => ({
          ...prev,
          crops: r.data?.crops || [],
        }))
        setMetadataStatus('succeeded')
      })
      .catch((e) => {
        if (cancelled) return
        console.error('Failed to load crops:', e)
        setMetadataStatus('failed')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedCrop) return
    let cancelled = false
    setMetadata((prev) => ({ ...prev, states: [], districts: [] }))
    setSelectedState('')
    setSelectedDistrict('')
    api
      .get('/market-prices/metadata', {
        params: { crop: selectedCrop },
      })
      .then((r) => {
        if (cancelled) return
        setMetadata((prev) => ({
          ...prev,
          states: r.data?.states || [],
        }))
      })
      .catch((e) => console.error('Failed to load states:', e))
    return () => {
      cancelled = true
    }
  }, [selectedCrop])

  useEffect(() => {
    if (!selectedCrop || !selectedState) return
    let cancelled = false
    setMetadata((prev) => ({ ...prev, districts: [] }))
    setSelectedDistrict('')
    api
      .get('/market-prices/metadata', {
        params: { crop: selectedCrop, state: selectedState },
      })
      .then((r) => {
        if (cancelled) return
        setMetadata((prev) => ({
          ...prev,
          districts: r.data?.districts || [],
        }))
      })
      .catch((e) => console.error('Failed to load districts:', e))
    return () => {
      cancelled = true
    }
  }, [selectedCrop, selectedState])

  const runSearch = (page = 1) => {
    if (!selectedCrop || !selectedState) {
      alert(t('Please select a crop and state before searching.'))
      return
    }

    dispatch(setFilter({ key: 'crop', value: selectedCrop }))
    dispatch(setFilter({ key: 'state', value: selectedState }))
    dispatch(setFilter({ key: 'market', value: selectedMarket }))
    dispatch(setFilter({ key: 'district', value: selectedDistrict }))

    setCurrentPage(page)

    dispatch(
      fetchMarketPrices({
        crop: selectedCrop,
        state: selectedState,
        market: selectedMarket || undefined,
        district: selectedDistrict || undefined,
        page,
        limit: 50,
      })
    )

    setHasSearched(true)
  }

  const handleReset = () => {
    setSelectedCrop('')
    setSelectedState('')
    setSelectedMarket('')
    setSelectedDistrict('')
    setCurrentPage(1)
    setHasSearched(false)
    dispatch(resetFilters())
  }

  const results = list?.results || []
  const isLive = list?.is_live || false
  const source = list?.source || 'demo'

  const stats = results.length > 0
    ? {
        min: Math.min(...results.filter(r => r.modal_price != null).map(r => r.modal_price)),
        max: Math.max(...results.filter(r => r.modal_price != null).map(r => r.modal_price)),
        avg: (results.filter(r => r.modal_price != null).reduce((sum, r) => sum + r.modal_price, 0) / results.filter(r => r.modal_price != null).length).toFixed(0),
      }
    : null

  const bestMandi = results.reduce((acc, r) => {
      if (!acc) return { price: r.modal_price, market: r.market }
      if (r.modal_price > acc.price) return { price: r.modal_price, market: r.market }
      return acc
  }, null)

  if (!hasSearched) {
    return (
      <>
        <PageHeader
          eyebrow={t("Market Intelligence")}
          title={t("Market Intelligence Workspace")}
          description={t("Access live AGMARKNET pricing data and trends across India.")}
        />
        <MarketPulseSnapshot />

        <div className="ac-card mx-auto max-w-2xl p-6 sm:p-8 bg-white border border-earth-200 shadow-sm rounded-3xl">
          <h2 className="font-display text-lg font-bold text-ink-900 mb-6">{t("Configure Market Scope")}</h2>

          {metadataStatus === 'failed' && (
            <div className="mb-6 rounded-lg border border-rust-200 bg-rust-50 p-4 text-sm text-rust-700">
              {t("Could not load options. Please refresh.")}
            </div>
          )}

          <div className="grid gap-5">
            <SearchableSelect
              id="crop-select"
              label={t("Crop")}
              value={selectedCrop}
              onChange={setSelectedCrop}
              options={metadata.crops}
              placeholder={t("Select a crop")}
              disabled={metadataStatus === 'loading'}
            />
            <SearchableSelect
              id="state-select"
              label={t("State")}
              value={selectedState}
              onChange={setSelectedState}
              options={metadata.states}
              placeholder={t("Select a state")}
              disabled={metadataStatus === 'loading'}
            />
            <input
                type="text"
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
                placeholder={t("Market (Optional, e.g., Azadpur)")}
                className={FIELD_CLASS}
            />
            <SearchableSelect
              id="district-select"
              label={t("District (Optional)")}
              value={selectedDistrict}
              onChange={setSelectedDistrict}
              options={metadata.districts}
              placeholder={t("Select district")}
              disabled={metadataStatus === 'loading' || !selectedState}
            />
          </div>

          <div className="mt-8 flex gap-3 pt-6 border-t border-earth-100">
            <button
              onClick={() => runSearch(1)}
              disabled={!selectedCrop || !selectedState}
              className="flex-1 flex gap-2 justify-center items-center rounded-xl bg-primary-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-800 disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              {t("Analyze Prices")}
            </button>
            <button
              onClick={handleReset}
              className="rounded-xl bg-earth-100 px-6 py-3 text-sm font-bold text-ink-900 transition hover:bg-earth-200"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="mb-6">
        <PageHeader
          eyebrow={t("Market Intelligence")}
          title={t("Market workspace")}
          description={t("Insights for %s in %s.", selectedCrop, selectedState)}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 relative">
          <div className="flex gap-2 z-10">
              <span className="rounded-full bg-primary-50 text-primary-900 px-4 py-1 text-xs font-extrabold border border-primary-200 shadow-xs uppercase tracking-wider">{selectedCrop}</span>
              <span className="rounded-full bg-earth-100 text-ink-800 px-4 py-1 text-xs font-bold border border-earth-200 shadow-xs">{selectedState}</span>
          </div>
          <button onClick={handleReset} className="text-sm font-bold text-primary-700 hover:text-primary-800 transition z-10 bg-white/70 px-4 py-1.5 rounded-full border border-primary-100">
            {t("Modify Filters")}
          </button>
      </div>

      {listStatus === 'succeeded' && (
        <>
          {results.length > 0 && <MarketPulseSnapshot crop={selectedCrop} state={selectedState} stats={stats} bestMandi={bestMandi} />}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-12">
            <div className="lg:col-span-7 flex flex-col h-full bg-white rounded-3xl p-5 border border-earth-200 shadow-sm transition hover:shadow-md duration-300">
                <h3 className="font-display text-sm font-black text-ink-900 mb-4 uppercase tracking-wider border-b border-earth-100 pb-3">
                    {t("Price Momentum")}
                </h3>
                {selectedCrop && (
                    <div className="flex-1 flex flex-col justify-end">
                       <PriceTrendChart crop={selectedCrop} state={selectedState} market={selectedMarket} height={320} />
                    </div>
                )}
            </div>

            <div className="lg:col-span-5 flex flex-col h-full bg-white rounded-3xl p-5 border border-earth-200 shadow-sm transition hover:shadow-md duration-300">
                <h3 className="font-display text-sm font-black text-ink-900 mb-4 uppercase tracking-wider border-b border-earth-100 pb-3">
                    {t("Nearby Market Opportunities")}
                </h3>
                {selectedCrop && selectedState && (
                    <div className="flex-1">
                        <MandiMap crop={selectedCrop} state={selectedState} />
                    </div>
                )}
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-earth-200 bg-white shadow-sm transition hover:shadow-md duration-300 mb-10">
            <div className="p-5 sm:p-6 border-b border-earth-100 flex flex-wrap justify-between items-center bg-earth-50/50 gap-4">
                <h3 className="font-display text-sm font-black uppercase tracking-wider text-ink-900 flex items-center gap-2">
                    <TableIcon className="h-4 w-4 text-ink-500" /> {t("Market Price Observations")}
                </h3>
                <LiveBadge isLive={isLive} source={source} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white border-b border-earth-100">
                  <tr>
                    {['Market', 'Location', 'Min', 'Modal', 'Max', 'Date'].map(h => (
                       <th key={h} className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-ink-500">{t(h)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-earth-100">
                  {results.slice(0, 15).map((row, idx) => (
                    <tr key={idx} className="hover:bg-earth-50/80 transition-colors duration-150">
                      <td className="px-6 py-4 text-sm font-bold text-ink-900 whitespace-nowrap">{row.market}</td>
                      <td className="px-6 py-4 text-sm text-ink-600 whitespace-nowrap">{row.location || row.state}</td>
                      <td className="px-6 py-4 text-sm text-ink-700 whitespace-nowrap">{fmtInr(row.min_price)}</td>
                      <td className="px-6 py-4 text-sm font-black text-primary-800 whitespace-nowrap bg-primary-50/30">{fmtInr(row.modal_price)}</td>
                      <td className="px-6 py-4 text-sm text-ink-700 whitespace-nowrap">{fmtInr(row.max_price)}</td>
                      <td className="px-6 py-4 text-sm text-ink-500 whitespace-nowrap">{formatDate(row.price_date)}</td>
                    </tr>
                  ))}
                  {results.length === 0 && (
                      <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-sm text-ink-500">
                              {t("No price observations match your filters.")}
                          </td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>
            {results.length > 15 && (
                <div className="px-6 py-4 border-t border-earth-100 bg-earth-50/30 text-center">
                    <span className="text-xs font-semibold text-ink-500">
                        {t("Showing top")} 15 {t("results.")}
                    </span>
                </div>
            )}
          </div>
        </>
      )}
    </>
  )
}

export default MarketPrices
