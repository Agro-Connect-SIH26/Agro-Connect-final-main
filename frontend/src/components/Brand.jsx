import { useLanguage } from '../hooks/LanguageContext.jsx'

/**
 * components/Brand.jsx — the single, shared brand mark.
 *
 * Used by AppShell, TopBar, Landing page, Auth pages, and 404.
 *
 * Sizes:
 *   xs:  24px logo / text-sm
 *   sm:  32px logo / text-base (mobile headers)
 *   md:  40px logo / text-xl (navbars, card headers)
 *   lg:  44-48px logo / text-2xl (landing page desktop navbar, prominent headers)
 *   xl:  56px logo / text-3xl (auth hero, spotlight headers)
 */
export default function Brand({
  mark = true,
  wordmark = true,
  className = '',
  size = 'md',
  glyphClassName = '',
  textClassName = '',
}) {
  const { t } = useLanguage()

  const sizes = {
    xs: { wrap: 'gap-1.5', glyph: 'h-6 w-6', text: 'text-sm font-semibold' },
    sm: { wrap: 'gap-2', glyph: 'h-8 w-8', text: 'text-base font-semibold' },
    md: { wrap: 'gap-2.5', glyph: 'h-10 w-10', text: 'text-xl font-bold' },
    lg: { wrap: 'gap-3', glyph: 'h-10 w-10 sm:h-12 sm:w-12', text: 'text-xl sm:text-2xl font-bold' },
    xl: { wrap: 'gap-3.5', glyph: 'h-14 w-14', text: 'text-3xl font-extrabold' },
  }
  const s = sizes[size] || sizes.md

  return (
    <span className={`inline-flex items-center ${s.wrap} ${className}`}>
      {mark && (
        <img
          src="/favicon.svg"
          alt="AgroConnect Logo"
          className={`${s.glyph} object-contain rounded-xl flex-shrink-0 drop-shadow-xs transition-transform hover:scale-105 duration-200 ${glyphClassName}`}
        />
      )}
      {wordmark && (
        <span className={`font-display tracking-tight text-ink-900 ${s.text} ${textClassName}`}>
          {t("AgroConnect")}
        </span>
      )}
    </span>
  )
}
