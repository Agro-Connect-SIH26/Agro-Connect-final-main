/**
 * components/SideNav.jsx — primary navigation for the logged-in app.
 *
 * Why a side nav (and not just a top bar):
 *   The original design had only a horizontal TopBar with no
 *   role-specific links, so each page reinvented its own header. The
 *   side nav gives every logged-in page a single, persistent map of
 *   "where am I, where can I go next" — exactly the affordance the
 *   redesign brief asks for.
 *
 * Role-aware: SELLER and BUYER see different primary items. FPO is a
 * shared item that drops the user into /fpos (the canonical route per
 *   [[fpo-canonical-route]]).
 *
 * On mobile (<lg), the side nav collapses into a bottom nav with the
 * 4 most-touched items. The full list lives behind a "More" button
 * that opens a slide-up drawer. The drawer uses the same items so
 * mobile and desktop speak the same vocabulary.
 */
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  selectIsAuthed,
  selectRole,
  selectName,
  selectPublicId,
} from '../redux/slices/authSlice.js'
import { useLanguage } from '../hooks/LanguageContext.jsx'

// Inline nav icons (stroke-only, currentColor). Inlined so we don't
// pull another package and so they recolor with the nav state.
const ICON = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  ),
  crops: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a5 5 0 0 0-5 5c0 4 5 11 5 11s5-7 5-11a5 5 0 0 0-5-5Z" />
      <circle cx="12" cy="8" r="2" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  ),
  market: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h18l-1.5 12a2 2 0 0 1-2 1.8H6.5a2 2 0 0 1-2-1.8L3 7Z" />
      <path d="M8 7V5a4 4 0 0 1 8 0v2" />
    </svg>
  ),
  offers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-3.5-7.1" />
      <path d="M21 4v5h-5" />
    </svg>
  ),
  deals: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12.5 11 14.5 15 10.5" />
      <path d="M21 12a9 9 0 1 1-3.5-7.1" />
      <path d="M21 4v5h-5" />
    </svg>
  ),
  fpo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="3" />
      <circle cx="17" cy="11" r="2.5" />
      <path d="M3 19c0-3 2.5-5 6-5s6 2 6 5" />
      <path d="M14 19c0-2 1.5-4 3-4s3 2 3 4" />
    </svg>
  ),
  msgs: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.5 8.5 0 1 1-3.4-6.8L21 4l-1 3.4A8.4 8.4 0 0 1 21 11.5Z" />
      <path d="M8 11h8M8 8h5" />
    </svg>
  ),
  inbox: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 13l3-8h12l3 8" />
      <path d="M3 13v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6" />
      <path d="M3 13h5l1 2h6l1-2h5" />
    </svg>
  ),
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="8" height="10" rx="1.5" />
      <rect x="13" y="3" width="8" height="6" rx="1.5" />
      <rect x="13" y="11" width="8" height="10" rx="1.5" />
      <rect x="3" y="15" width="8" height="6" rx="1.5" />
    </svg>
  ),
}

// Role-aware navigation definitions with grouping.
const SELLER_NAV = [
  {
    group: 'MY FARM WORKSPACE',
    items: [
      { to: '/seller', label: 'Daily Canvas', icon: 'dashboard', exact: true },
      { to: '/seller/crop-lots', label: 'My Crops Portfolio', icon: 'crops' },
      { to: '/seller/crop-lots/new', label: 'Smart Sell Wizard', icon: 'plus' },
    ]
  },
  {
    group: 'INTELLIGENCE & DECISIONS',
    items: [
      { to: '/market-prices', label: 'Market Pulse & Mandis', icon: 'market' },
      { to: '/seller/demands', label: 'Buyer Demands Board', icon: 'msgs' },
    ]
  },
  {
    group: 'SELLING & DEALS',
    items: [
      { to: '/seller/offers', label: 'Active Offers', icon: 'offers' },
      { to: '/seller/deals', label: 'Deals & Escrow', icon: 'deals' },
    ]
  },
  {
    group: 'ECOSYSTEM & SERVICES',
    items: [
      { to: '/fpos', label: 'FPO Collectives', icon: 'fpo' },
      { to: '/services', label: 'Storage & Logistics', icon: 'inbox' },
      { to: '/seller/profile', label: 'Farmer Credibility Profile', icon: 'home' },
    ]
  },
]

const BUYER_NAV = [
  {
    group: 'SOURCING WORKSPACE',
    items: [
      { to: '/buyer', label: 'Sourcing Dashboard', icon: 'dashboard', exact: true },
      { to: '/buyer/marketplace', label: 'Crop Lots Supply', icon: 'inbox' },
      { to: '/buyer/demands', label: 'My Procurement Demands', icon: 'msgs' },
      { to: '/buyer/demands/new', label: 'Post New Demand', icon: 'plus' },
    ]
  },
  {
    group: 'MARKET & COLLECTIVES',
    items: [
      { to: '/market-prices', label: 'Mandi Price Intelligence', icon: 'market' },
      { to: '/fpos', label: 'FPO Aggregators', icon: 'fpo' },
    ]
  },
  {
    group: 'TRANSACTIONS',
    items: [
      { to: '/buyer/offers', label: 'Offers Sent & Received', icon: 'offers' },
      { to: '/buyer/deals', label: 'Active Deals & Escrow', icon: 'deals' },
    ]
  },
  {
    group: 'ACCOUNT',
    items: [
      { to: '/buyer/profile', label: 'Buyer Profile', icon: 'home' },
    ]
  },
]

const SERVICE_PROVIDER_NAV = [
  {
    group: 'SERVICE HUB',
    items: [
      { to: '/provider', label: 'Requests Workspace', icon: 'dashboard', exact: true },
      { to: '/services', label: 'Services Directory', icon: 'inbox' },
      { to: '/market-prices', label: 'Mandi Intelligence', icon: 'market' },
    ]
  },
]

// Mobile bottom nav shows the 4 highest-frequency items. The full list
// lives behind the "More" sheet.
const MOBILE_PRIMARY = (role) => {
  if (role === 'BUYER') {
    return [
      { to: '/buyer', label: 'Home', icon: 'home', exact: true },
      { to: '/buyer/marketplace', label: 'Lots', icon: 'inbox' },
      { to: '/buyer/demands/new', label: 'Demand', icon: 'plus' },
      { to: '/buyer/offers', label: 'Offers', icon: 'offers' },
    ]
  }
  if (role === 'SERVICE_PROVIDER') {
    return [
      { to: '/provider', label: 'Home', icon: 'home', exact: true },
      { to: '/services', label: 'Directory', icon: 'fpo' },
      { to: '/market-prices', label: 'Market', icon: 'market' },
    ]
  }
  return [
    { to: '/seller', label: 'Home', icon: 'home', exact: true },
    { to: '/seller/crop-lots', label: 'Crops', icon: 'crops' },
    { to: '/seller/crop-lots/new', label: 'Add', icon: 'plus' },
    { to: '/seller/offers', label: 'Offers', icon: 'offers' },
  ]
}

function isActive(pathname, item) {
  if (item.exact) return pathname === item.to
  if (item.to === '/seller' || item.to === '/buyer' || item.to === '/farmer') {
    return false // exact-only for home
  }
  return pathname === item.to || pathname.startsWith(item.to + '/')
}

function NavList({ groups, pathname, onNavigate }) {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.group}>
          <p className="ac-section-label mb-2 px-3">{group.group}</p>
          <nav className="flex flex-col gap-1">
            {group.items.map((item) => {
              const active = isActive(pathname, item)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200
                    ${active
                      ? 'bg-primary-700 text-white shadow-sm'
                      : 'text-ink-600 hover:bg-earth-100 hover:text-ink-900'}`}
                >
                  <span className={`flex h-5 w-5 items-center justify-center ${active ? 'text-white' : 'text-ink-400 group-hover:text-primary-700'}`}>
                    {ICON[item.icon]}
                  </span>
                  {t(item.label)}
                </Link>
              )
            })}
          </nav>
        </div>
      ))}
    </div>
  )
}

function MobileBottomNav({ role, pathname, onMoreOpen }) {
  const { t } = useLanguage()
  const items = MOBILE_PRIMARY(role)
  return (
    <nav
      aria-label={t("Primary")}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-earth-200 bg-white/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = isActive(pathname, item)
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-medium
                  ${active ? 'text-primary-700' : 'text-ink-500'}`}
              >
                <span className={`flex h-5 w-5 items-center justify-center ${active ? 'text-primary-700' : 'text-ink-400'}`}>
                  {ICON[item.icon]}
                </span>
                {t(item.label)}
              </Link>
            </li>
          )
        })}
        <li>
          <button
            type="button"
            onClick={onMoreOpen}
            aria-label={t("More")}
            className="flex min-h-[48px] w-full flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-medium text-ink-500"
          >
            <span className="flex h-5 w-5 items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" />
              </svg>
            </span>{t("More")}</button>
        </li>
      </ul>
    </nav>
  )
}

export default function SideNav() {
  const { t } = useLanguage()
  const location = useLocation()
  const isAuthed = useSelector(selectIsAuthed)
  const role = useSelector(selectRole)
  const name = useSelector(selectName)
  const publicId = useSelector(selectPublicId)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Public pages (landing, login, register, role-select) hide the
  // side nav entirely. Authed pages get the full shell.
  if (!isAuthed) return null
  // The /role page is authed but not yet committed to a role; render
  // an empty shell to avoid flashing the wrong nav.
  if (!role) return null

  const items = role === 'BUYER' ? BUYER_NAV : role === 'SERVICE_PROVIDER' ? SERVICE_PROVIDER_NAV : SELLER_NAV
  const itemsMobile = items // full list, used in the "More" sheet

  return (
    <>
      {/* DESKTOP side rail — only on lg+ */}
      <aside
        aria-label={t("Primary")}
        className="hidden lg:flex lg:w-60 lg:flex-shrink-0 lg:flex-col lg:border-r lg:border-earth-200 lg:bg-white"
      >
        <div className="px-4 pt-6 pb-3">
          <p className="ac-section-label">{t("Signed in as")}</p>
          <p className="mt-1 truncate text-sm font-semibold text-ink-900">
            {name || publicId || 'You'}
          </p>
          <span className="ac-chip ac-chip-earth mt-2">
            {role === 'BUYER' ? 'Buyer' : role === 'SERVICE_PROVIDER' ? 'Service Provider' : 'Farmer / Seller'}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <NavList groups={items} pathname={location.pathname} />
        </div>
        <div className="border-t border-earth-200 p-3">
          <p className="text-[11px] leading-relaxed text-ink-400">
            Built for Indian agriculture · mandi prices from AGMARKNET
          </p>
        </div>
      </aside>

      {/* MOBILE bottom nav + drawer */}
      <MobileBottomNav role={role} pathname={location.pathname} onMoreOpen={() => setMobileOpen(true)} />
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t("More navigation")}
        >
          <button
            type="button"
            aria-label={t("Close menu")}
            className="absolute inset-0 bg-ink-900/40 animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5 pb-8 shadow-2xl animate-fade-in">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink-200" />
            <p className="ac-section-label px-1">{t("All sections")}</p>
            <div className="mt-2 text-left">
              <NavList
                groups={itemsMobile}
                pathname={location.pathname}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
