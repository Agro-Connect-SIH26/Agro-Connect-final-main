import { useSelector } from 'react-redux'
import { selectRole, selectName, selectEmail, selectPhone, selectPublicId, selectIsDemo } from '../redux/slices/authSlice.js'
import useCredibility from '../hooks/useCredibility.js'
import PageHeader from '../components/PageHeader.jsx'
import usePageMeta from '../hooks/usePageMeta.js'
import CredibilityBadge from '../components/CredibilityBadge.jsx'
import { useLanguage } from '../hooks/LanguageContext.jsx'

export default function BuyerProfile() {
  const { t } = useLanguage()
  const role = useSelector(selectRole)
  const name = useSelector(selectName)
  const email = useSelector(selectEmail)
  const phone = useSelector(selectPhone)
  const publicId = useSelector(selectPublicId)
  const isDemo = useSelector(selectIsDemo)

  const { credibility } = useCredibility(publicId, role)

  usePageMeta({
    title: t('Profile'),
  })

  return (
    <>
      <PageHeader
        eyebrow={t("Account")}
        title={t("My Profile")}
        description={t("Your contact information and platform credibility score.")}
      />
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">

          <div className="md:col-span-1">
            <div className="ac-card flex flex-col items-center justify-center p-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-3xl font-semibold text-primary-800">
                {(name || email || 'A').trim().slice(0, 1).toUpperCase()}
              </div>
              <h2 className="mt-4 text-xl font-medium text-ink-900">{name || t('Buyer')}</h2>
              <div className="mt-1">
                <span className="ac-chip ac-chip-primary">{t("Buyer")}</span>
                {isDemo && <span className="ac-chip ac-chip-earth ml-2">{t("Demo Account")}</span>}
              </div>

              <div className="mt-6 w-full text-left">
                <p className="ac-section-label mb-2 text-center text-xs">{t("Credibility Rating")}</p>
                <div className="flex justify-center">
                  <CredibilityBadge
                    score={credibility?.score}
                    available={credibility?.available}
                    role={role}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="ac-card">
              <div className="border-b border-earth-100 px-6 py-4">
                <h3 className="text-lg font-medium text-ink-900">{t("Personal Information")}</h3>
              </div>
              <ul className="divide-y divide-earth-100">
                <li className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink-500">{t("Name")}</span>
                    <span className="text-sm text-ink-900">{name || '—'}</span>
                  </div>
                </li>
                <li className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink-500">{t("Email address")}</span>
                    <span className="text-sm text-ink-900">{email || '—'}</span>
                  </div>
                </li>
                <li className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink-500">{t("Phone number")}</span>
                    <span className="text-sm text-ink-900">{phone || '—'}</span>
                  </div>
                </li>
                <li className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink-500">{t("Account ID")}</span>
                    <span className="font-mono text-sm text-ink-900">{publicId}</span>
                  </div>
                </li>
                <li className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink-500">{t("Verification")}</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-700">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      {t("Verified Business")}
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
