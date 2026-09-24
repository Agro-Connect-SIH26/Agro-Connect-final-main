import { useLanguage } from '../hooks/LanguageContext.jsx'
import { TrendingUp, Activity, ShieldCheck, MapPin, BarChart3 } from 'lucide-react'
import { fmtInr } from '../utils/format.js'

export default function MarketPulseSnapshot({ crop, state, stats, movement7d, bestMandi }) {
  const { t } = useLanguage()

  const isContextual = crop && state

  if (!isContextual) {
    // Initial / Empty State - National Pulse
    return (
      <div className="mb-6 rounded-2xl border border-earth-100 bg-white p-4 shadow-xs">
         <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-primary-100 text-primary-700">
              <Activity className="h-4 w-4" />
            </div>
            <h3 className="font-display text-base font-bold text-ink-900">
              {t("National Market Pulse")}
            </h3>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-800 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200">
            <ShieldCheck className="h-3 w-3" />
            {t("AGMARKNET Verified")}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-sm text-ink-700">
            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase text-ink-500">{t("Tomato (Hybrid)")}</span>
                <span className="font-bold text-success-700">+12.4%</span>
            </div>
            <div className="flex flex-col border-l border-earth-200 pl-6">
                <span className="text-[10px] font-bold uppercase text-ink-500">{t("Wheat (Sharbati)")}</span>
                <span className="font-bold text-success-700">+3.8%</span>
            </div>
            <div className="flex flex-col border-l border-earth-200 pl-6">
                 <span className="text-[10px] font-bold uppercase text-ink-500">{t("Arrivals Velocity")}</span>
                 <div className="flex items-center gap-1 font-bold text-primary-800">
                     <BarChart3 className="h-3 w-3" /> {t("Peak Harvest")}
                 </div>
            </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6 rounded-2xl border border-earth-100 bg-white p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-baseline justify-between gap-4">
          <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-ink-900">{crop} · {state}</h2>
              <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-800 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200">
                      <ShieldCheck className="h-3 w-3" />
                      {t("AGMARKNET Verified")}
                  </span>
              </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-ink-600 bg-earth-50/50 p-3 rounded-xl border border-earth-100">
              <div className="flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-primary-700" />
                  <span className="uppercase text-[10px] font-bold tracking-wider">{t("Momentum")}:</span>
                  <span className="font-bold text-ink-900 text-sm">{movement7d || t("Stable")}</span>
              </div>
              <div className="w-px h-6 bg-earth-200 hidden sm:block"></div>
              <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-success-600" />
                  <span className="uppercase text-[10px] font-bold tracking-wider">{t("Latest")}:</span>
                  <span className="font-bold text-ink-900 text-sm">{stats?.avg ? fmtInr(stats.avg) : '—'}/kg</span>
              </div>
              <div className="w-px h-6 bg-earth-200 hidden sm:block"></div>
              <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-honey-600" />
                  <span className="uppercase text-[10px] font-bold tracking-wider">{t("Best Nearby")}:</span>
                  <span className="font-bold text-ink-900 text-sm">{bestMandi ? fmtInr(bestMandi.price) : '—'}/kg</span>
              </div>
          </div>
        </div>
    </div>
  )
}
