/**
 * MandiMap.jsx — Leaflet map for "Where to sell? Nearby mandis"
 */
import { useEffect, useMemo, useState, useRef } from 'react'
import api from '../api/axios.js'
import { fmtInr } from '../utils/format.js'
import { MapPin, AlertTriangle, Truck, TrendingUp } from 'lucide-react'
import { useLanguage } from '../hooks/LanguageContext.jsx'

const FREIGHT_PER_KM_PER_KG = 0.012
const R_KM = 6371

function haversineKm(a, b) {
  if (!a || !b) return null
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

function priceTone(price, min, max) {
  if (price == null) return { class: 'bg-ink-300', hex: '#b3b3ad' }
  if (max && max > min && (max - min) > 0) {
    const r = (price - min) / (max - min)
    if (r >= 0.66) return { class: 'bg-success-600', hex: '#155345' }
    if (r >= 0.33) return { class: 'bg-honey-500', hex: '#a87e1d' }
    return { class: 'bg-rust-500', hex: '#8a4020' }
  }
  return { class: 'bg-primary-500', hex: '#3d7a3d' }
}

export default function MandiMap({ crop, state, lot }) {
  const { t } = useLanguage()

  const [status, setStatus] = useState('loading')
  const [err, setErr] = useState(null)
  const [mandis, setMandis] = useState([])
  const [activeMandiId, setActiveMandiId] = useState(null)

  const lotPin =
    lot && Number.isFinite(lot.lat) && Number.isFinite(lot.lon)
      ? { lat: lot.lat, lon: lot.lon, name: lot.location || 'Lot' }
      : null

  useEffect(() => {
    if (!crop) return
    let cancelled = false
    setStatus('loading')
    setErr(null)
    const params = { crop }
    if (state) params.state = state
    api
      .get('/market-prices', { params })
      .then((r) => {
        if (cancelled) return
        const list = (r.data?.results || []).filter(
          (m) => m && Number.isFinite(Number(m.lat)) && Number.isFinite(Number(m.lon))
        )
        setMandis(list)
        setStatus('succeeded')
      })
      .catch((e) => {
        if (cancelled) return
        setErr(e.response?.data?.detail || e.message)
        setStatus('failed')
      })
    return () => {
      cancelled = true
    }
  }, [crop, state])

  const enriched = useMemo(() => {
    if (!mandis.length) return []
    const prices = mandis.map((m) => Number(m.modal_price) || 0)
    const minP = Math.min(...prices)
    const maxP = Math.max(...prices)
    const list = mandis.map((m) => {
      const pin = { lat: Number(m.lat), lon: Number(m.lon) }
      const distKm = lotPin ? haversineKm(lotPin, pin) : null
      const transport = distKm == null ? null : +(distKm * FREIGHT_PER_KM_PER_KG).toFixed(2)
      const price = Number(m.modal_price) || 0
      const net = transport != null ? +(price - transport).toFixed(2) : price
      return {
        ...m,
        id: `${m.market}-${m.state}`,
        distKm: distKm == null ? null : +distKm.toFixed(1),
        transport,
        net,
        tone: priceTone(price, minP, maxP),
      }
    })
    const bestNet = Math.max(...list.map(m => m.net))
    return list.map(m => ({ ...m, isBest: m.net === bestNet }))
  }, [mandis, lotPin])

  const listRef = useRef(null)
  const handleMandiClick = (id) => {
    setActiveMandiId(id)
    const el = document.getElementById(`mandi-row-${id}`)
    if (el && listRef.current) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }

  if (status === 'loading') {
    return <div className="animate-pulse rounded-card border border-ink-100 bg-earth-50 p-6 text-sm text-ink-500">{t("Loading nearby mandis…")}</div>
  }
  if (status === 'failed') {
    return <div className="rounded-card border border-rust-200 bg-rust-50 p-3 text-sm text-rust-700"><AlertTriangle className="mr-1 inline h-4 w-4" />{t("Could not load mandis.")} {err}</div>
  }
  if (status === 'succeeded' && mandis.length === 0) {
    return <div className="rounded-card border border-ink-100 bg-earth-50 p-4 text-sm text-ink-600">{t("No mandi price data found for")} <strong>{crop}</strong> {state ? t("in") + ' ' + state : ''}. {t("Prices will appear once AGMARKNET data is available.")}</div>
  }

  const sortedMandis = enriched.slice().sort((a, b) => b.net - a.net)
  const best = sortedMandis.find(m => m.isBest)

  return (
    <div className="rounded-card border border-ink-100 bg-white grid grid-cols-1 lg:grid-cols-5 overflow-hidden shadow-sm">
      <div className="lg:col-span-3 relative bg-earth-50 h-[300px] lg:h-[360px]">
        <OsmMap lotPin={lotPin} mandis={enriched} activeMandiId={activeMandiId} onMandiClick={handleMandiClick} t={t} />
      </div>

      <div className="lg:col-span-2 flex flex-col bg-white border-l border-ink-100 max-h-[300px] lg:max-h-[360px]">
        <div className="p-4 border-b border-ink-100 bg-white sticky top-0 z-10 shrink-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-base text-ink-900">{t("Nearby mandis")} · {crop}</h3>
            {best && (
              <span className="ac-chip ac-chip-success shrink-0 text-xs">
                <TrendingUp className="mr-1 inline h-3 w-3" />
                {t("Best net")}: {fmtInr(best.net)}/kg
              </span>
            )}
          </div>
          {!lotPin && (
            <p className="mt-2 text-xs text-honey-800 flex items-start gap-1">
              <AlertTriangle className="mr-1 mt-0.5 inline h-3 w-3 shrink-0" />
              <span>{t("Lot coordinates not on file. Showing mandi prices only — distance is unavailable.")}</span>
            </p>
          )}
          <p className="mt-1 text-[11px] text-ink-500">
            {t("Distances are straight-line (haversine), not driving distance.")}{' '}
            {t("Transport cost assumes")} ₹{FREIGHT_PER_KM_PER_KG}{t("/kg/km.")}
          </p>
        </div>

        <ul className="flex-1 overflow-y-auto p-4 pt-1 divide-y divide-ink-100 space-y-1" ref={listRef}>
          {sortedMandis.map((m) => {
            const isActive = activeMandiId === m.id
            return (
              <li
                id={`mandi-row-${m.id}`}
                key={m.id}
                onClick={() => handleMandiClick(m.id)}
                className={`group flex cursor-pointer items-center justify-between gap-3 p-2 rounded-lg transition-colors ${
                  isActive ? 'bg-primary-50 border border-primary-100 shadow-sm' : 'hover:bg-earth-50 border border-transparent'
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 shadow-sm ${isActive ? 'ring-2 ring-primary-300 ring-offset-1' : ''} ${m.tone.class}`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                      <p className={`truncate font-medium text-sm transition-colors ${isActive ? 'text-primary-900' : 'text-ink-800'}`}>
                        {m.market}
                      </p>
                      {m.state && <p className="truncate text-xs text-ink-500">{m.state}</p>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-right text-xs">
                  <span className={`font-semibold text-sm ${isActive ? 'text-primary-800' : 'text-ink-900'}`}>
                    {fmtInr(m.net)}/kg
                  </span>
                  {(m.distKm != null || m.transport != null) && (
                      <div className="flex flex-wrap items-center justify-end gap-2 text-[11px] text-ink-500">
                        {m.distKm != null && <span className="flex items-center"><MapPin className="mr-0.5 inline h-3 w-3" />{m.distKm} km</span>}
                        {m.transport != null && <span className="flex items-center text-rust-600"><Truck className="mr-0.5 inline h-3 w-3" />−₹{m.transport}/kg</span>}
                      </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

function OsmMap({ lotPin, mandis, activeMandiId, onMandiClick, t }) {
  const [Mod, setMod] = useState(null)
  const [tileOk, setTileOk] = useState(true)
  const [err, setErr] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([import('react-leaflet'), import('leaflet')])
      .then(([rl, L]) => {
        if (cancelled) return
        delete L.Icon.Default.prototype._getIconUrl
        L.Icon.Default.mergeOptions({ iconRetinaUrl: '', iconUrl: '', shadowUrl: '' })
        setMod({ ...rl, L })
      })
      .catch((e) => !cancelled && setErr(e.message || 'Map library unavailable'))
    return () => { cancelled = true }
  }, [])

  if (err || !Mod) return <div className="p-3 text-xs text-ink-500">{t("Map view unavailable.")} {err ? `(${err})` : t("Loading…")} {t("List of mandis and net realization is below.")}</div>

  const { MapContainer, TileLayer, CircleMarker, Tooltip, Polyline, useMap } = Mod
  const center = lotPin ? [lotPin.lat, lotPin.lon] : mandis.length ? [mandis.reduce((s, m) => s + Number(m.lat), 0)/mandis.length, mandis.reduce((s, m) => s + Number(m.lon), 0)/mandis.length] : [20.5937, 78.9629]

  function MapRecenter({ activeMandi }) {
    const map = useMap()
    useEffect(() => {
      if (activeMandi && Number.isFinite(Number(activeMandi.lat)) && Number.isFinite(Number(activeMandi.lon))) {
        map.panTo([Number(activeMandi.lat), Number(activeMandi.lon)], { animate: true })
      }
    }, [activeMandi, map])
    return null
  }

  const activeMandiObj = mandis.find(m => m.id === activeMandiId)

  return (
    <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%', zIndex: 0 }} scrollWheelZoom={false}>
        {tileOk && <TileLayer attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" eventHandlers={{ tileerror: () => setTileOk(false) }} />}
        {lotPin && (
          <CircleMarker center={[lotPin.lat, lotPin.lon]} radius={8} pathOptions={{ color: '#1f6f43', fillColor: '#1f6f43', fillOpacity: 0.9 }}>
            <Tooltip direction="top"><strong>{lotPin.name}</strong><br />{t("Your lot")}</Tooltip>
          </CircleMarker>
        )}
        {mandis.map((m) => {
            const isActive = m.id === activeMandiId
            return (
              <CircleMarker
                key={m.id}
                center={[Number(m.lat), Number(m.lon)]}
                radius={isActive ? 8 : 6}
                pathOptions={{
                  color: isActive ? '#000000' : m.tone.hex,
                  weight: isActive ? 2 : 1,
                  fillColor: m.tone.hex,
                  fillOpacity: isActive ? 1 : 0.7,
                }}
                eventHandlers={{ click: () => onMandiClick(m.id) }}
              >
                <Tooltip direction="top">
                  <strong>{m.market}</strong><br />
                  {fmtInr(m.modal_price)}/kg {t("modal")}
                  {m.distKm != null && <><br />{m.distKm} {t("km away (straight-line)")}</>}
                  <br />{t("Net")} {fmtInr(m.net)}/kg
                </Tooltip>
              </CircleMarker>
            )
        })}
        {lotPin && mandis.map((m) => (
          <Polyline key={m.id} positions={[[lotPin.lat, lotPin.lon], [Number(m.lat), Number(m.lon)]]} pathOptions={{ color: '#cdc6b3', weight: 1, dashArray: '4 4' }} />
        ))}
        <MapRecenter activeMandi={activeMandiObj} />
    </MapContainer>
  )
}
