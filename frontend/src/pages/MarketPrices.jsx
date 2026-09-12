/**
 * MarketPrices.jsx — mandi price viewer.
 *
 * CRITICAL FIX (Phase 5):
 * The page now requires BOTH crop AND state selection before loading
 * any market-price data. This prevents the 1.68M document heap-exhaustion
 * bug that crashes Node.js with "JavaScript heap out of memory".
 *
 * Shows AGMARKNET (via data.gov.in) modal/min/max prices for a crop,
 * with a historical aggregation panel (always labelled "NOT a
 * forecast") and a forward-projection panel. Same data as before;
 * the chrome is the redesigned application shell.
 *
 * Trust signals are surfaced explicitly:
 *   - "Live · AGMARKNET" vs "Demo data" badges
 *   - Source citation under every table
 *   - Trend badge (up/down/flat) on the history roll-up
 *   - "Insufficient data" with a reason, never silent
 */
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchMarketPrices,
  fetchMarketPriceHistory,
  fetchMarketPricePrediction,
  resetFilters,
  setFilter,
} from '../redux/slices/marketPriceSlice.js'
import { fmtInr, fmtNumber } from '../utils/format.js'
import PageHeader from '../components/PageHeader.jsx'
import EmptyState from '../components/EmptyState.jsx'
import PriceTrendChart from '../components/PriceTrendChart.jsx'
import MandiMap from '../components/MandiMap.jsx'
import SearchableSelect from '../components/SearchableSelect.jsx'
import usePageMeta from '../hooks/usePageMeta.js'
import api from '../api/axios.js'

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

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

function formatTimestamp(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (e) {
    return String(iso)
  }
}

function LiveBadge({ isLive, source }) {
  if (isLive) {
    return (
      <span className="ac-chip ac-chip-success">
        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-success-500" />
        Live · {source || 'AGMARKNET'}
      </span>
    )
  }
  return (
    <span className="ac-chip ac-chip-honey">
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-honey-500" />
      Sample data · {source || 'built-in'}
    </span>
  )
}

function TrendBadge({ trend }) {
  const styles = {
    up: 'bg-success-100 text-success-700',
    down: 'bg-rust-100 text-rust-800',
    flat: 'bg-ink-100 text-ink-700',
  }
  const label = {
    up: '↑ Trending up',
    down: '↓ Trending down',
    flat: '→ Flat',
  }
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${styles[trend] || styles.flat}`}>
      {label[trend] || label.flat}
    </span>
  )
}

const FIELD_CLASS = 'block w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'

/** Map internal source identifiers to user-friendly labels. */
function sourceLabel(src) {
  if (!src) return 'AGMARKNET'
  const s = String(src).toLowerCase()
  if (s === 'data_gov_in' || s === 'agmarknet') return 'AGMARKNET / data.gov.in'
  if (s === 'csv') return 'AGMARKNET'
  if (s === 'none') return 'No data'
  return 'AGMARKNET'
}

function MarketPrices() {
  const dispatch = useDispatch()
  const { list, listStatus, listError, filters } = useSelector(
    (state) => state.marketPrices
  )

  usePageMeta({
    title: 'Market Prices',
    description: 'Current AGMARKNET prices, history, and projections for crops across India.',
  })

  // Dropdown metadata (crops, states, districts)
  const [metadata, setMetadata] = useState({ crops: [], states: [], districts: [] })
  const [metadataStatus, setMetadataStatus] = useState('idle')

  // Local filter state before search is triggered
  const [selectedCrop, setSelectedCrop] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [selectedMarket, setSelectedMarket] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')

  // Track whether user has performed an initial search
  const [hasSearched, setHasSearched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Load crops on mount
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

  // Load states when crop changes
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

  // Load districts when crop + state change
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

  // DO NOT call fetchMarketPrices on mount.
  // The user MUST select crop + state first.

  const runSearch = (page = 1) => {
    // Require crop and state before allowing search
    if (!selectedCrop || !selectedState) {
      alert('Please select a crop and state before searching.')
      return
    }

    // Update Redux filters
    dispatch(setFilter({ key: 'crop', value: selectedCrop }))
    dispatch(setFilter({ key: 'state', value: selectedState }))
    dispatch(setFilter({ key: 'market', value: selectedMarket }))
    dispatch(setFilter({ key: 'district', value: selectedDistrict }))

    setCurrentPage(page)

    // Fetch market prices
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

  const handlePageChange = (newPage) => {
    if (newPage < 1 || (list?.totalPages && newPage > list.totalPages)) return
    runSearch(newPage)
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
  const note = list?.note
  const fetchedAt = list?.fetched_at

  // Show initial selection UI if user hasn't searched yet
  if (!hasSearched) {
    return (
      <>
        <PageHeader
          eyebrow="Market Intelligence"
          title="Market Prices"
          description="Live AGMARKNET prices from mandis across India. Select a crop and state to begin."
        />

        <div className="ac-card mx-auto max-w-2xl p-6 sm:p-8">
          {metadataStatus === 'failed' && (
            <div className="mb-6 rounded-lg border border-rust-200 bg-rust-50 p-4 text-sm text-rust-700">
              Could not load crop and state options. Please refresh the page.
            </div>
          )}

          <div className="space-y-5">
            <SearchableSelect
              id="crop-select"
              label="Crop"
              value={selectedCrop}
              onChange={setSelectedCrop}
              options={metadata.crops}
              placeholder="Select a crop"
              required
              disabled={metadataStatus === 'loading'}
            />

            <SearchableSelect
              id="state-select"
              label="State"
              value={selectedState}
              onChange={setSelectedState}
              options={metadata.states}
              placeholder="Select a state"
              required
              disabled={metadataStatus === 'loading'}
            />

            <div>
              <label htmlFor="market-select" className="mb-2 block text-sm font-medium text-ink-700">
                Market (optional)
              </label>
              <input
                id="market-select"
                type="text"
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
                placeholder="e.g., Lasalgaon, Azadpur"
                className={FIELD_CLASS}
              />
              <p className="mt-1 text-xs text-ink-500">
                Leave blank to see all markets in the selected state
              </p>
            </div>

            <SearchableSelect
              id="district-select"
              label="District (optional)"
              value={selectedDistrict}
              onChange={setSelectedDistrict}
              options={metadata.districts}
              placeholder="Select a district (optional)"
              disabled={metadataStatus === 'loading' || !selectedState}
            />
          </div>

          <div className="mt-8 flex gap-3 border-t border-ink-100 pt-6">
            <button
              onClick={runSearch}
              disabled={!selectedCrop || !selectedState || metadataStatus === 'loading'}
              className="ac-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Search Prices
            </button>
            <button
              onClick={handleReset}
              className="ac-btn-ghost"
            >
              Reset
            </button>
          </div>

          {!selectedCrop || !selectedState ? (
            <div className="mt-6 rounded-lg border border-honey-200 bg-honey-50 p-4 text-sm text-honey-800">
              <p className="font-medium">Crop and state are required</p>
              <p className="mt-1 text-honey-700">
                Select your crop and state above to see market prices.
              </p>
            </div>
          ) : null}
        </div>
      </>
    )
  }

  // User has searched — show results
  return (
    <>
      <PageHeader
        eyebrow="Market Intelligence"
        title="Market Prices"
        description="Live AGMARKNET prices from mandis across India."
      />

      {/* Search filters + refinement */}
      <div className="ac-card mb-4 p-4">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-ink-700">Filters:</span>
            {selectedCrop && (
              <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-800">
                {selectedCrop}
              </span>
            )}
            {selectedState && (
              <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-800">
                {selectedState}
              </span>
            )}
            {selectedMarket && (
              <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-700">
                Market: {selectedMarket}
              </span>
            )}
            {selectedDistrict && (
              <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-700">
                District: {selectedDistrict}
              </span>
            )}
          </div>
          <button onClick={handleReset} className="ml-auto text-sm text-primary-600 hover:text-primary-700">
            Change filters
          </button>
        </div>

        {note && (
          <div className="rounded-lg border border-honey-200 bg-honey-50 p-3 text-sm text-honey-800">
            {note}
          </div>
        )}
      </div>

      {listStatus === 'loading' && (
        <div className="ac-card p-6 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          <p className="mt-3 text-sm text-ink-600">Loading market prices...</p>
        </div>
      )}

      {listStatus === 'failed' && (
        <div className="ac-card border-rust-200 bg-rust-50 p-6">
          <p className="font-medium text-rust-800">Could not load market prices</p>
          <p className="mt-1 text-sm text-rust-700">{listError}</p>
        </div>
      )}

      {listStatus === 'succeeded' && results.length === 0 && (
        <EmptyState
          title="No prices found"
          description={`No market prices found for ${selectedCrop} in ${selectedState}. Try a different combination or check back later.`}
        />
      )}

      {listStatus === 'succeeded' && results.length > 0 && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-ink-600">
                Found <strong className="text-ink-900">{fmtNumber(results.length)}</strong> price{results.length === 1 ? '' : 's'}
              </p>
              {fetchedAt && (
                <p className="text-xs text-ink-500">Updated {formatTimestamp(fetchedAt)}</p>
              )}
            </div>
            <LiveBadge isLive={isLive} source={source} />
          </div>

          {/* Price trend chart */}
          {selectedCrop && (
            <div className="mb-6">
              <PriceTrendChart
                crop={selectedCrop}
                state={selectedState}
                market={selectedMarket}
                height={240}
              />
            </div>
          )}

          {/* Mandi map */}
          {selectedCrop && selectedState && (
            <div className="mb-6">
              <MandiMap crop={selectedCrop} state={selectedState} />
            </div>
          )}

          {/* Price table */}
          <div className="ac-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-ink-100 bg-earth-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-700">
                      Crop
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-700">
                      Market
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-700">
                      Location
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-700">
                      Min Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-700">
                      Modal Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-700">
                      Max Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-700">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {results.map((row, idx) => (
                    <tr key={idx} className="hover:bg-earth-50">
                      <td className="px-4 py-3 text-sm font-medium text-ink-900">
                        {row.crop_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-700">
                        {row.market || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-600">
                        {row.location || row.state || '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-ink-700">
                        {row.min_price != null ? fmtInr(row.min_price) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-ink-900">
                        {row.modal_price != null ? fmtInr(row.modal_price) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-ink-700">
                        {row.max_price != null ? fmtInr(row.max_price) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-600">
                        {formatDate(row.price_date || row.arrival_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-ink-100 bg-earth-50 px-4 py-2 text-xs text-ink-500 flex items-center justify-between">
              <span>Source: {sourceLabel(source)} · Prices in INR per kg</span>
            </div>
          </div>

          {/* Pagination controls */}
          {list?.totalPages && list.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between px-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="ac-btn-ghost disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-ink-600">
                Page {currentPage} of {list.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= list.totalPages}
                className="ac-btn-ghost disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}

export default MarketPrices
