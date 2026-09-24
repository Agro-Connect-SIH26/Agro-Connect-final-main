import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Sparkles, ShieldCheck, Zap, BarChart3, Users,
  Truck, PackageCheck, Menu, X, ArrowUpRight, CheckCircle2,
  TrendingUp, Scaling, MapPin, Calculator, BookOpen, AlertCircle,
  Building2, Warehouse, ChevronRight, Layers, DollarSign,
  TrendingDown, FileText, Check, Compass, Cpu, HelpCircle
} from 'lucide-react'
import Brand from '../components/Brand.jsx'
import { useLanguage } from '../hooks/LanguageContext.jsx'

export default function Landing() {
  const { t, lang, setLang } = useLanguage()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeTab, setActiveTab] = useState('direct')

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { name: t('Features'), href: '#features' },
    { name: t('How It Works'), href: '#how-it-works' },
    { name: t('Decision Engine'), href: '#decision-support' },
    { name: t('Market Intelligence'), href: '#market-intelligence' },
    { name: t('Ecosystem'), href: '#ecosystem' },
  ]

  return (
    <div className="bg-white min-h-screen text-ink-900 font-sans selection:bg-primary-200">
      {/* ==================================================
          A. NAVIGATION
          ================================================== */}
      <header className={`sticky top-0 z-50 transition-all duration-200 ${scrolled ? 'bg-white/95 backdrop-blur-md border-b border-earth-200 shadow-sm' : 'bg-white border-b border-earth-100'}`}>
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <Brand size="lg" />
          </Link>

          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => (
              <a key={item.name} href={item.href} className="text-sm font-bold text-ink-600 hover:text-primary-800 px-3 py-2 cursor-pointer transition-colors rounded-lg hover:bg-earth-50">
                {item.name}
              </a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
             <div className="flex items-center bg-earth-50 border border-earth-200 rounded-xl p-1 shadow-xs">
                 {['en', 'hi', 'mr'].map((l) => (
                    <button
                       key={l}
                       onClick={() => setLang(l)}
                       className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors ${lang === l ? 'bg-white text-primary-800 shadow-sm' : 'text-ink-500 hover:text-ink-800'}`}
                    >
                       {l.toUpperCase()}
                    </button>
                 ))}
             </div>
             <Link to="/login" className="text-sm font-bold text-ink-700 hover:text-primary-800 px-4 py-2 transition-colors">{t("Sign In")}</Link>
             <Link to="/register" className="ac-btn-primary text-sm font-bold py-2.5 px-5 shadow-sm transform transition hover:scale-105 active:scale-95">{t("Get Started")}</Link>
          </div>

          <button className="lg:hidden p-2 text-ink-600 hover:text-ink-900 transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
             {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {mobileMenuOpen && (
           <div className="lg:hidden border-t border-earth-200 bg-white absolute w-full shadow-lg">
              <div className="px-4 py-6 space-y-4">
                 {navItems.map((item) => (
                    <a key={item.name} href={item.href} onClick={() => setMobileMenuOpen(false)} className="block text-base font-bold text-ink-700 hover:text-primary-800 hover:bg-earth-50 px-3 py-2 rounded-xl">
                      {item.name}
                    </a>
                 ))}
                 <div className="pt-4 border-t border-earth-100 flex flex-col gap-3">
                    <select value={lang} onChange={(e) => setLang(e.target.value)} className="rounded-xl border border-earth-300 px-4 py-3 text-sm font-bold text-ink-900 shadow-sm bg-earth-50">
                       <option value="en">English</option>
                       <option value="hi">हिंदी (Hindi)</option>
                       <option value="mr">मराठी (Marathi)</option>
                    </select>
                    <Link to="/login" className="ac-btn-secondary w-full text-center py-3">{t("Sign In")}</Link>
                    <Link to="/register" className="ac-btn-primary w-full text-center py-3">{t("Get Started")}</Link>
                 </div>
              </div>
           </div>
        )}
      </header>

      {/* ==================================================
          B. HERO
          ================================================== */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 lg:pt-20 lg:pb-32 bg-gradient-to-b from-earth-50/50 via-white to-white">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3">
           <div className="w-[600px] h-[600px] bg-primary-100/50 rounded-full blur-[100px] opacity-70"></div>
        </div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3">
           <div className="w-[500px] h-[500px] bg-earth-200/60 rounded-full blur-[100px] opacity-60"></div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10 grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-6 lg:pr-8 xl:pr-12 text-center lg:text-left">
             <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-xs font-bold text-primary-900 border border-primary-200 shadow-xs mb-6 sm:mb-8">
                <Sparkles className="h-3.5 w-3.5 text-primary-600" />
                {t("Data-Driven Agricultural Market Linkage")}
             </span>
             <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-ink-900 leading-[1.05]">
                {t("Sell Smarter.")}<br/>
                <span className="text-primary-800">{t("Reach Better Markets.")}</span>
             </h1>
             <p className="mt-6 text-lg sm:text-xl text-ink-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                {t("AgroConnect helps farmers decide where, when and to whom to sell by combining market prices, buyer demand, logistics, storage and estimated net realization.")}
             </p>
             <div className="mt-10 flex flex-col sm:flex-row flex-wrap gap-4 justify-center lg:justify-start">
                <Link to="/register" className="ac-btn-primary text-base font-bold py-3.5 px-8 shadow-md hover:shadow-lg transition flex items-center justify-center gap-2">
                  {t("Get Started")} <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#decision-support" className="ac-btn-secondary text-base font-bold py-3.5 px-8 shadow-sm bg-white hover:bg-earth-50 flex items-center justify-center gap-2">
                  {t("Decision Engine Demo")}
                </a>
             </div>
          </div>

          <div className="lg:col-span-6 mt-8 lg:mt-0 relative">
            <div className="relative rounded-3xl bg-gradient-to-br from-earth-100 to-primary-100 p-1.5 lg:p-2 shadow-2xl shadow-primary-900/10 border border-primary-200/50 transform lg:-rotate-2 transition-transform hover:rotate-0 duration-500">
               <div className="bg-white rounded-[1.25rem] p-6 sm:p-8 shadow-sm">
                 <div className="flex items-start justify-between border-b border-earth-100 pb-5 mb-5 relative">
                    <div>
                       <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-success-800 bg-success-50 border border-success-200 px-2 py-0.5 rounded-full mb-2">
                          <CheckCircle2 className="h-3 w-3" /> {t("Optimal Sourcing Signal")}
                       </span>
                       <h3 className="font-display font-bold text-xl sm:text-2xl text-ink-900">Direct B2B Buyer</h3>
                    </div>
                    <div className="text-right flex-shrink-0">
                       <p className="font-bold text-sm sm:text-base text-ink-900">Tomato (Hybrid) · 500kg</p>
                       <p className="text-xs text-ink-500 font-semibold mt-1 flex items-center justify-end gap-1"><MapPin className="h-3 w-3"/> Ranchi • {t("Illustrative Example")}</p>
                    </div>
                 </div>

                 <div className="space-y-3 font-medium text-sm text-ink-800">
                    <div className="flex justify-between items-center bg-primary-50 p-4 rounded-xl border border-primary-200 shadow-sm relative overflow-hidden">
                       <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600"></div>
                       <div>
                          <p className="font-bold text-primary-900 text-sm sm:text-base flex items-center gap-2">
                             1. {t("Direct Buyer")}
                             <span className="hidden sm:inline-flex text-[10px] bg-primary-200 text-primary-900 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">{t("Highest Spot Margin")}</span>
                          </p>
                          <p className="text-[11px] sm:text-xs text-primary-700 mt-1">{t("Offer")} ₹26.00/kg · {t("Logistics")} ₹2.00/kg</p>
                       </div>
                       <div className="text-right">
                          <p className="font-black text-primary-900 text-base sm:text-lg">{t("Net")} ₹24.00/kg</p>
                          <p className="text-[11px] sm:text-xs text-primary-800 font-bold mt-1">{t("Total")} ₹12,000</p>
                       </div>
                    </div>

                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-earth-200">
                       <div className="opacity-70">
                          <p className="font-bold text-ink-900 text-sm sm:text-base">2. {t("Local Mandi")} (Ranchi)</p>
                          <p className="text-[11px] sm:text-xs text-ink-600 mt-1">{t("Modal")} ₹22.00/kg · {t("Freight")} ₹1.50/kg · {t("Fees")} ₹0.70/kg</p>
                       </div>
                       <div className="text-right opacity-70">
                          <p className="font-bold text-ink-900 text-base">Net ₹19.80/kg</p>
                          <p className="text-[11px] sm:text-xs text-ink-500 font-semibold mt-1">{t("Total")} ₹9,900</p>
                       </div>
                    </div>
                 </div>

                 <div className="mt-5 pt-4 border-t border-earth-100 flex items-center justify-between text-xs">
                     <div className="flex items-center gap-2 text-ink-500 font-medium">
                        <Calculator className="h-4 w-4 text-ink-400" />
                        <span className="hidden sm:inline">{t("Auto-calculated using:")} <strong>{t("Gross Selling Value")} − {t("Logistics")} & {t("Fees")}</strong></span>
                        <span className="sm:hidden">{t("Gross")} − {t("Costs")}</span>
                     </div>
                     <span className="font-bold text-primary-800 bg-primary-50 px-2 py-1 rounded-md">{t("Net Realization")}</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          C. TRUST / ECOSYSTEM STRIP
          ================================================== */}
      <section className="border-y border-earth-200 bg-earth-50/60 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-800 font-bold">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ink-400">{t("Verified National Data")}</p>
                <p className="text-sm font-bold text-ink-800">{t("Verified market benchmarks sourced from AGMARKNET / data.gov.in")}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10 text-center">
              <div className="border-l border-earth-200 pl-4 text-left">
                <p className="font-display text-2xl font-black text-ink-900">{t("Pan-India")}</p>
                <p className="text-xs font-medium text-ink-500">{t("Mandi Coverage")}</p>
              </div>
              <div className="border-l border-earth-200 pl-4 text-left">
                <p className="font-display text-2xl font-black text-primary-700">100%</p>
                <p className="text-xs font-medium text-ink-500">{t("Net Margin Math")}</p>
              </div>
              <div className="border-l border-earth-200 pl-4 text-left">
                <p className="font-display text-2xl font-black text-ink-900">4 Roles</p>
                <p className="text-xs font-medium text-ink-500">{t("Farmers, Buyers, FPOs, Logistics")}</p>
              </div>
              <div className="border-l border-earth-200 pl-4 text-left">
                <p className="font-display text-2xl font-black text-ink-900">Trilingual</p>
                <p className="text-xs font-medium text-ink-500">English • हिंदी • मराठी</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          D. PROBLEM → SOLUTION
          ================================================== */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3.5 py-1 text-xs font-bold text-primary-800 border border-primary-200 mb-4">
              <Scaling className="h-3.5 w-3.5" /> {t("Transforming Agricultural Trade")}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-ink-900 tracking-tight">
              {t("Why Traditional Selling Fails Farmers")}
            </h2>
            <p className="mt-4 text-base sm:text-lg text-ink-600 font-medium">
              {t("Without transparent data, farmers lose up to 30% of their realization to hidden transport costs, local cartels, and timing mismatches.")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* 1 */}
            <div className="rounded-3xl border border-earth-200 p-6 sm:p-8 bg-earth-50/40 hover:border-primary-300 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-rust-100 text-rust-800">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-ink-900">{t("Opaque Mandi Prices & Information Asymmetry")}</h3>
              </div>
              <p className="text-sm text-ink-600 mb-6 leading-relaxed">
                {t("Farmers rely on hearsay or single local mandi rates, unaware that nearby wholesale markets or direct buyers offer 15-30% higher net realization.")}
              </p>
              <div className="bg-white rounded-2xl p-4 border border-earth-200 text-sm flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-success-600 flex-shrink-0" />
                <span className="font-bold text-ink-800">{t("AgroConnect Solution: Multi-mandi AGMARKNET price tracking.")}</span>
              </div>
            </div>

            {/* 2 */}
            <div className="rounded-3xl border border-earth-200 p-6 sm:p-8 bg-earth-50/40 hover:border-primary-300 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-rust-100 text-rust-800">
                  <Truck className="h-6 w-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-ink-900">{t("Blind Freight & Storage Cost Calculations")}</h3>
              </div>
              <p className="text-sm text-ink-600 mb-6 leading-relaxed">
                {t("Traveling to a distant market seems profitable until high fuel, toll, vehicle hire, and mandi cess erase all theoretical gains.")}
              </p>
              <div className="bg-white rounded-2xl p-4 border border-earth-200 text-sm flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-success-600 flex-shrink-0" />
                <span className="font-bold text-ink-800">{t("AgroConnect Solution: Automatic net realization formula factoring freight, cess & warehouse fees.")}</span>
              </div>
            </div>

            {/* 3 */}
            <div className="rounded-3xl border border-earth-200 p-6 sm:p-8 bg-earth-50/40 hover:border-primary-300 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-rust-100 text-rust-800">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-ink-900">{t("Excessive Intermediaries & Delayed Payments")}</h3>
              </div>
              <p className="text-sm text-ink-600 mb-6 leading-relaxed">
                {t("Layers of middlemen take commission at every step while farmers face 30-60 day delayed credit settlement risks.")}
              </p>
              <div className="bg-white rounded-2xl p-4 border border-earth-200 text-sm flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-success-600 flex-shrink-0" />
                <span className="font-bold text-ink-800">{t("AgroConnect Solution: Direct institutional buyer marketplace with structured counter-proposals & escrow-style tracking.")}</span>
              </div>
            </div>

            {/* 4 */}
            <div className="rounded-3xl border border-earth-200 p-6 sm:p-8 bg-earth-50/40 hover:border-primary-300 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-rust-100 text-rust-800">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-ink-900">{t("Smallholder Scale Disadvantage")}</h3>
              </div>
              <p className="text-sm text-ink-600 mb-6 leading-relaxed">
                {t("Individual farmers with small lots lack bargaining power and cannot meet high-volume institutional buyer quotas.")}
              </p>
              <div className="bg-white rounded-2xl p-4 border border-earth-200 text-sm flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-success-600 flex-shrink-0" />
                <span className="font-bold text-ink-800">{t("AgroConnect Solution: FPO lot pooling allowing farmers to combine harvest into premium bulk shipments.")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          E. HOW IT WORKS
          ================================================== */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-earth-50/70 border-y border-earth-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3.5 py-1 text-xs font-bold text-primary-800 border border-primary-200 mb-4">
              <Sparkles className="h-3.5 w-3.5" /> {t("Step-By-Step Simplicity")}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-ink-900 tracking-tight">
              {t("How AgroConnect Works")}
            </h2>
            <p className="mt-4 text-base sm:text-lg text-ink-600 font-medium">
              {t("From harvest to settlement in 5 transparent, data-driven steps.")}
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-4 lg:gap-6 relative">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-6 border border-earth-200 shadow-xs flex flex-col justify-between relative">
              <div className="absolute -top-3 left-6 bg-primary-800 text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                01
              </div>
              <div>
                <div className="p-3 bg-primary-50 rounded-xl w-fit text-primary-700 mb-4 mt-1">
                  <PackageCheck className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-ink-900 mb-2">{t("1. Add Crop Details")}</h3>
                <p className="text-xs text-ink-600 leading-relaxed">
                  {t("Specify crop, variety, harvest quantity (kg), target timeline, and farm location.")}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-6 border border-earth-200 shadow-xs flex flex-col justify-between relative">
              <div className="absolute -top-3 left-6 bg-primary-800 text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                02
              </div>
              <div>
                <div className="p-3 bg-primary-50 rounded-xl w-fit text-primary-700 mb-4 mt-1">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-ink-900 mb-2">{t("2. Scan Live Markets")}</h3>
                <p className="text-xs text-ink-600 leading-relaxed">
                  {t("Cross-reference AGMARKNET spot prices across APMC mandis.")}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-6 border border-earth-200 shadow-xs flex flex-col justify-between relative">
              <div className="absolute -top-3 left-6 bg-primary-800 text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                03
              </div>
              <div>
                <div className="p-3 bg-primary-50 rounded-xl w-fit text-primary-700 mb-4 mt-1">
                  <Calculator className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-ink-900 mb-2">{t("3. Compare Net Realization")}</h3>
                <p className="text-xs text-ink-600 leading-relaxed">
                  {t("Compare Direct Buyer offers vs. Mandis vs. Cold Storage with all logistics and fees deducted.")}
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-2xl p-6 border border-earth-200 shadow-xs flex flex-col justify-between relative">
              <div className="absolute -top-3 left-6 bg-primary-800 text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                04
              </div>
              <div>
                <div className="p-3 bg-primary-50 rounded-xl w-fit text-primary-700 mb-4 mt-1">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-ink-900 mb-2">{t("4. Connect & Lock Terms")}</h3>
                <p className="text-xs text-ink-600 leading-relaxed">
                  {t("Negotiate transparent pricing, arrange transport, and lock deals with audit-proof confirmations.")}
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-white rounded-2xl p-6 border border-earth-200 shadow-xs flex flex-col justify-between relative">
              <div className="absolute -top-3 left-6 bg-primary-800 text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                05
              </div>
              <div>
                <div className="p-3 bg-primary-50 rounded-xl w-fit text-primary-700 mb-4 mt-1">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-ink-900 mb-2">{t("5. Deliver & Realize Gains")}</h3>
                <p className="text-xs text-ink-600 leading-relaxed">
                  {t("Dispatch crop with confidence, track delivery milestones, and receive timely settlement.")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          F. CORE CAPABILITIES (FEATURES)
          ================================================== */}
      <section id="features" className="py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3.5 py-1 text-xs font-bold text-primary-800 border border-primary-200 mb-4">
              <Zap className="h-3.5 w-3.5" /> {t("Comprehensive Toolkit")}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-ink-900 tracking-tight">
              {t("Built for Every Corner of Agricultural Commerce")}
            </h2>
            <p className="mt-4 text-base sm:text-lg text-ink-600 font-medium">
              {t("Tools engineered specifically for Indian agri-supply chains, from spot market benchmarks to cold chain logistics.")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="rounded-3xl border border-earth-200 p-6 sm:p-8 bg-gradient-to-b from-earth-50/50 to-white hover:border-primary-300 transition-all hover:shadow-md">
              <div className="h-12 w-12 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-800 mb-6">
                <Calculator className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-ink-900 mb-3">{t("Net Realization Engine")}</h3>
              <p className="text-sm text-ink-600 leading-relaxed mb-4">
                {t("Never compare raw market prices again. Our engine calculates: Gross Selling Price − Freight − Tolls − Loading − Mandi Cess = Actual Net Profit.")}
              </p>
              <ul className="space-y-2 text-xs font-semibold text-ink-700">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary-600"/> {t("Dynamic per-km vehicle hire models")}</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary-600"/> {t("Cold storage holding break-even calculators")}</li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="rounded-3xl border border-earth-200 p-6 sm:p-8 bg-gradient-to-b from-earth-50/50 to-white hover:border-primary-300 transition-all hover:shadow-md">
              <div className="h-12 w-12 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-800 mb-6">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-ink-900 mb-3">{t("AGMARKNET Market Intelligence")}</h3>
              <p className="text-sm text-ink-600 leading-relaxed mb-4">
                {t("Modal, min, and max price benchmarks across APMC mandis nationwide.")}
              </p>
              <ul className="space-y-2 text-xs font-semibold text-ink-700">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary-600"/> {t("Live state & district price radar")}</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary-600"/> {t("7-day price volatility indicators")}</li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="rounded-3xl border border-earth-200 p-6 sm:p-8 bg-gradient-to-b from-earth-50/50 to-white hover:border-primary-300 transition-all hover:shadow-md">
              <div className="h-12 w-12 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-800 mb-6">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-ink-900 mb-3">{t("Direct Institutional B2B Buyers")}</h3>
              <p className="text-sm text-ink-600 leading-relaxed mb-4">
                {t("Connect directly with verified corporate food processors, retail aggregators, and exporters seeking quality-graded lots.")}
              </p>
              <ul className="space-y-2 text-xs font-semibold text-ink-700">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary-600"/> {t("Verified buyer badge credentials")}</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary-600"/> {t("Direct contract farming proposals")}</li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="rounded-3xl border border-earth-200 p-6 sm:p-8 bg-gradient-to-b from-earth-50/50 to-white hover:border-primary-300 transition-all hover:shadow-md">
              <div className="h-12 w-12 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-800 mb-6">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-ink-900 mb-3">{t("FPO Lot Pooling & Group Power")}</h3>
              <p className="text-sm text-ink-600 leading-relaxed mb-4">
                {t("Empowering Farmer Producer Organizations to aggregate member harvests into institutional-grade bulk supply lots.")}
              </p>
              <ul className="space-y-2 text-xs font-semibold text-ink-700">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary-600"/> {t("Farmer member opt-in management")}</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary-600"/> {t("Bulk price negotiation leverage")}</li>
              </ul>
            </div>

            {/* Feature 5 */}
            <div className="rounded-3xl border border-earth-200 p-6 sm:p-8 bg-gradient-to-b from-earth-50/50 to-white hover:border-primary-300 transition-all hover:shadow-md">
              <div className="h-12 w-12 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-800 mb-6">
                <Truck className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-ink-900 mb-3">{t("Logistics & Route Optimizer")}</h3>
              <p className="text-sm text-ink-600 leading-relaxed mb-4">
                {t("Estimate exact road transit costs, vehicle load utilization, and locate certified local transport partners.")}
              </p>
              <ul className="space-y-2 text-xs font-semibold text-ink-700">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary-600"/> {t("Per-km & per-quintal freight models")}</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary-600"/> {t("Transit degradation risk assessment")}</li>
              </ul>
            </div>

            {/* Feature 6 */}
            <div className="rounded-3xl border border-earth-200 p-6 sm:p-8 bg-gradient-to-b from-earth-50/50 to-white hover:border-primary-300 transition-all hover:shadow-md">
              <div className="h-12 w-12 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-800 mb-6">
                <Warehouse className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-ink-900 mb-3">{t("Cold Storage Break-Even Radar")}</h3>
              <p className="text-sm text-ink-600 leading-relaxed mb-4">
                {t("Decide whether to sell fresh or hold in storage. Computes storage fees vs. expected price appreciation.")}
              </p>
              <ul className="space-y-2 text-xs font-semibold text-ink-700">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary-600"/> {t("Monthly holding cost simulator")}</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary-600"/> {t("Weight loss & decay depreciation math")}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          G. MAIN DECISION-SUPPORT SHOWCASE
          ================================================== */}
      <section id="decision-support" className="py-20 sm:py-28 bg-earth-900 text-white relative overflow-hidden">
        {/* Background glow accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-earth-600/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-800/80 px-3.5 py-1 text-xs font-bold text-primary-200 border border-primary-700 mb-4">
              <Cpu className="h-3.5 w-3.5" /> {t("The Core Engine")}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              {t("Decision Support in Action")}
            </h2>
            <p className="mt-4 text-base sm:text-lg text-earth-300 font-medium">
              {t("See how our algorithm compares 4 realistic selling options for a sample 1,000 kg Onion harvest.")}
            </p>
          </div>

          {/* Realization Equation Banner */}
          <div className="bg-earth-800/80 border border-earth-700 rounded-3xl p-6 mb-12 text-center max-w-4xl mx-auto backdrop-blur-md">
            <p className="text-xs font-bold uppercase tracking-wider text-primary-400 mb-2">{t("The Net Realization Principle")}</p>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 font-display text-base sm:text-xl font-bold">
              <span className="bg-earth-700 px-3 py-1.5 rounded-xl">{t("Gross Sale Value")}</span>
              <span className="text-earth-400">−</span>
              <span className="bg-earth-700 px-3 py-1.5 rounded-xl">{t("Freight & Tolls")}</span>
              <span className="text-earth-400">−</span>
              <span className="bg-earth-700 px-3 py-1.5 rounded-xl">{t("Mandi Fees & Cess")}</span>
              <span className="text-earth-400">=</span>
              <span className="bg-primary-600 text-white px-4 py-1.5 rounded-xl shadow-sm">{t("Estimated Net Realization")}</span>
            </div>
          </div>

          {/* Scenario Comparison Grid */}
          <div className="grid md:grid-cols-4 gap-6">
            {/* Option 1: Direct B2B Buyer (Recommended) */}
            <div className="rounded-3xl border-2 border-primary-500 bg-earth-800 p-6 flex flex-col justify-between relative shadow-xl">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-[11px] font-black uppercase px-3 py-0.5 rounded-full shadow-xs">
                ★ {t("Recommended Signal")}
              </div>
              <div>
                <div className="flex items-center justify-between mb-4 mt-2">
                  <span className="text-xs font-bold uppercase text-primary-300">{t("Option 1")}</span>
                  <span className="text-xs font-bold text-success-400 bg-success-900/50 px-2 py-0.5 rounded-md">{t("+₹4,200 vs Local")}</span>
                </div>
                <h3 className="font-display font-bold text-xl text-white mb-1">{t("Direct Buyer")}</h3>
                <p className="text-xs text-earth-300 mb-4">{t("Organized Retailer (Nagpur)")}</p>

                <div className="space-y-2 text-xs border-t border-earth-700 pt-4">
                  <div className="flex justify-between">
                    <span className="text-earth-400">{t("Offer Rate")}:</span>
                    <span className="font-bold text-white">₹32.00 / kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-earth-400">{t("Logistics Cost")}:</span>
                    <span className="text-rust-300">−₹2.20 / kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-earth-400">{t("Mandi Cess / Fees")}:</span>
                    <span className="text-success-400">₹0.00 (Direct)</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-earth-700 bg-earth-900/50 -mx-6 -mb-6 p-6 rounded-b-3xl">
                <p className="text-xs text-earth-400">{t("Net In-Hand Rate")}:</p>
                <p className="font-display text-2xl font-black text-primary-300">₹29.80 <span className="text-sm font-normal text-earth-400">/ kg</span></p>
                <p className="text-xs font-bold text-white mt-1">{t("Total Net")}: ₹29,800</p>
              </div>
            </div>

            {/* Option 2: Local APMC Mandi */}
            <div className="rounded-3xl border border-earth-700 bg-earth-800/60 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase text-earth-400">{t("Option 2")}</span>
                  <span className="text-xs font-medium text-earth-400">{t("Nearest Spot")}</span>
                </div>
                <h3 className="font-display font-bold text-xl text-white mb-1">{t("Local APMC Mandi")}</h3>
                <p className="text-xs text-earth-300 mb-4">{t("Nashik Mandi (18 km)")}</p>

                <div className="space-y-2 text-xs border-t border-earth-700 pt-4">
                  <div className="flex justify-between">
                    <span className="text-earth-400">{t("Modal Price")}:</span>
                    <span className="font-bold text-white">₹28.00 / kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-earth-400">{t("Local Freight")}:</span>
                    <span className="text-rust-300">−₹1.40 / kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-earth-400">{t("Mandi Fees & Cess")}:</span>
                    <span className="text-rust-300">−₹1.00 / kg</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-earth-700 bg-earth-900/50 -mx-6 -mb-6 p-6 rounded-b-3xl">
                <p className="text-xs text-earth-400">{t("Net In-Hand Rate")}:</p>
                <p className="font-display text-2xl font-black text-white">₹25.60 <span className="text-sm font-normal text-earth-400">/ kg</span></p>
                <p className="text-xs font-bold text-white mt-1">{t("Total Net")}: ₹25,600</p>
              </div>
            </div>

            {/* Option 3: Distant Premium Hub */}
            <div className="rounded-3xl border border-earth-700 bg-earth-800/60 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase text-earth-400">{t("Option 3")}</span>
                  <span className="text-xs font-medium text-earth-400">{t("High Gross Rate")}</span>
                </div>
                <h3 className="font-display font-bold text-xl text-white mb-1">{t("Distant Hub Mandi")}</h3>
                <p className="text-xs text-earth-300 mb-4">{t("Azadpur Mandi, Delhi")}</p>

                <div className="space-y-2 text-xs border-t border-earth-700 pt-4">
                  <div className="flex justify-between">
                    <span className="text-earth-400">{t("Modal Price")}:</span>
                    <span className="font-bold text-white">₹36.00 / kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-earth-400">{t("Long-Haul Freight")}:</span>
                    <span className="text-rust-300">−₹8.50 / kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-earth-400">{t("Transit Loss & Cess")}:</span>
                    <span className="text-rust-300">−₹2.10 / kg</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-earth-700 bg-earth-900/50 -mx-6 -mb-6 p-6 rounded-b-3xl">
                <p className="text-xs text-earth-400">{t("Net In-Hand Rate")}:</p>
                <p className="font-display text-2xl font-black text-white">₹25.40 <span className="text-sm font-normal text-earth-400">/ kg</span></p>
                <p className="text-xs font-bold text-white mt-1">{t("Total Net")}: ₹25,400</p>
              </div>
            </div>

            {/* Option 4: Cold Storage Hold */}
            <div className="rounded-3xl border border-earth-700 bg-earth-800/60 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase text-earth-400">{t("Option 4")}</span>
                  <span className="text-xs font-medium text-honey-400">{t("Hold 45 Days")}</span>
                </div>
                <h3 className="font-display font-bold text-xl text-white mb-1">{t("Cold Storage Hold")}</h3>
                <p className="text-xs text-earth-300 mb-4">{t("Local Warehousing")}</p>

                <div className="space-y-2 text-xs border-t border-earth-700 pt-4">
                  <div className="flex justify-between">
                    <span className="text-earth-400">{t("Forecast Price")}:</span>
                    <span className="font-bold text-white">₹34.00 / kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-earth-400">{t("Storage Fees (45d)")}:</span>
                    <span className="text-rust-300">−₹3.00 / kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-earth-400">{t("Weight Loss (5%)")}:</span>
                    <span className="text-rust-300">−₹1.70 / kg</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-earth-700 bg-earth-900/50 -mx-6 -mb-6 p-6 rounded-b-3xl">
                <p className="text-xs text-earth-400">{t("Net In-Hand Rate")}:</p>
                <p className="font-display text-2xl font-black text-honey-300">₹29.30 <span className="text-sm font-normal text-earth-400">/ kg</span></p>
                <p className="text-xs font-bold text-white mt-1">{t("Total Net")}: ₹29,300</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          H. ECOSYSTEM ROLES
          ================================================== */}
      <section id="ecosystem" className="py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3.5 py-1 text-xs font-bold text-primary-800 border border-primary-200 mb-4">
              <Users className="h-3.5 w-3.5" /> {t("Multi-Stakeholder Platform")}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-ink-900 tracking-tight">
              {t("Built for the Entire Agricultural Ecosystem")}
            </h2>
            <p className="mt-4 text-base sm:text-lg text-ink-600 font-medium">
              {t("Tailored dashboards and automated workflows for each market participant.")}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Farmers */}
            <div className="rounded-3xl border border-earth-200 p-6 bg-earth-50/40 hover:border-primary-300 transition-all flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-800 mb-5">
                  <Scaling className="h-6 w-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-ink-900 mb-2">{t("For Farmers")}</h3>
                <p className="text-xs text-ink-600 leading-relaxed mb-4">
                  {t("Compare net realization across all selling channels, find direct verified buyers, and eliminate blind spot selling.")}
                </p>
                <ul className="space-y-1.5 text-xs text-ink-700 font-medium">
                  <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary-600"/> {t("Publish crop lots in 60s")}</li>
                  <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary-600"/> {t("Live mandi benchmark tracking")}</li>
                  <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary-600"/> {t("Direct buyer proposals")}</li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-earth-200">
                <Link to="/register" className="text-xs font-bold text-primary-700 hover:text-primary-800 flex items-center gap-1">
                  {t("Join as Farmer")} →
                </Link>
              </div>
            </div>

            {/* Buyers */}
            <div className="rounded-3xl border border-earth-200 p-6 bg-earth-50/40 hover:border-primary-300 transition-all flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-800 mb-5">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-ink-900 mb-2">{t("For B2B Buyers")}</h3>
                <p className="text-xs text-ink-600 leading-relaxed mb-4">
                  {t("Source directly from farmgate with verified quality grades, transparent pricing, and structured RFQ workflows.")}
                </p>
                <ul className="space-y-1.5 text-xs text-ink-700 font-medium">
                  <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary-600"/> {t("Publish sourcing demand requirements")}</li>
                  <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary-600"/> {t("Procurement decision heuristic")}</li>
                  <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary-600"/> {t("Direct farmer lot bidding")}</li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-earth-200">
                <Link to="/register" className="text-xs font-bold text-primary-700 hover:text-primary-800 flex items-center gap-1">
                  {t("Join as Buyer")} →
                </Link>
              </div>
            </div>

            {/* FPOs */}
            <div className="rounded-3xl border border-earth-200 p-6 bg-earth-50/40 hover:border-primary-300 transition-all flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-800 mb-5">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-ink-900 mb-2">{t("For FPOs & Cooperatives")}</h3>
                <p className="text-xs text-ink-600 leading-relaxed mb-4">
                  {t("Aggregate member harvests into high-volume bulk lots to unlock institutional contracts and maximize collective farmer earnings.")}
                </p>
                <ul className="space-y-1.5 text-xs text-ink-700 font-medium">
                  <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary-600"/> {t("Lot aggregation & pooling")}</li>
                  <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary-600"/> {t("Member contribution ledger")}</li>
                  <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary-600"/> {t("Institutional deal execution")}</li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-earth-200">
                <Link to="/register" className="text-xs font-bold text-primary-700 hover:text-primary-800 flex items-center gap-1">
                  {t("Join as FPO")} →
                </Link>
              </div>
            </div>

            {/* Logistics & Storage */}
            <div className="rounded-3xl border border-earth-200 p-6 bg-earth-50/40 hover:border-primary-300 transition-all flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-800 mb-5">
                  <Truck className="h-6 w-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-ink-900 mb-2">{t("For Service Providers")}</h3>
                <p className="text-xs text-ink-600 leading-relaxed mb-4">
                  {t("Connect logistics fleets and cold storage warehouses with active agricultural trade demand and shipment dispatches.")}
                </p>
                <ul className="space-y-1.5 text-xs text-ink-700 font-medium">
                  <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary-600"/> {t("Shipment routing requests")}</li>
                  <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary-600"/> {t("Warehouse capacity listing")}</li>
                  <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary-600"/> {t("Structured payment milestones")}</li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-earth-200">
                <Link to="/register" className="text-xs font-bold text-primary-700 hover:text-primary-800 flex items-center gap-1">
                  {t("Partner with Us")} →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          I. DATA + TRUST TAXONOMY
          ================================================== */}
      <section className="py-20 sm:py-28 bg-earth-50/60 border-y border-earth-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3.5 py-1 text-xs font-bold text-primary-800 border border-primary-200 mb-4">
              <ShieldCheck className="h-3.5 w-3.5" /> {t("Data Integrity & Transparency")}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-ink-900 tracking-tight">
              {t("How We Categorize and Validate Information")}
            </h2>
            <p className="mt-4 text-base sm:text-lg text-ink-600 font-medium">
              {t("We maintain strict clarity between official reported figures, heuristic estimates, and verified platform transactions.")}
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-earth-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-3 w-3 rounded-full bg-primary-600"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-ink-500">{t("Category 1")}</span>
              </div>
              <h3 className="font-display font-bold text-lg text-ink-900 mb-2">{t("Reported Data")}</h3>
              <p className="text-xs text-ink-600 leading-relaxed">
                {t("Direct API benchmarks from AGMARKNET / Ministry of Agriculture reflecting actual physical mandi auctions and arrival counts.")}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-earth-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-3 w-3 rounded-full bg-earth-500"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-ink-500">{t("Category 2")}</span>
              </div>
              <h3 className="font-display font-bold text-lg text-ink-900 mb-2">{t("Estimated Data")}</h3>
              <p className="text-xs text-ink-600 leading-relaxed">
                {t("Heuristic route cost models, average freight slabs (₹/km/ton), toll estimates, and cold storage holding rates.")}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-earth-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-3 w-3 rounded-full bg-honey-500"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-ink-500">{t("Category 3")}</span>
              </div>
              <h3 className="font-display font-bold text-lg text-ink-900 mb-2">{t("Forecast Signals")}</h3>
              <p className="text-xs text-ink-600 leading-relaxed">
                {t("Rule-based decision support (Sell Now vs. Hold vs. Inter-State) combining price trends and seasonal arrivals.")}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-earth-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-3 w-3 rounded-full bg-success-600"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-ink-500">{t("Category 4")}</span>
              </div>
              <h3 className="font-display font-bold text-lg text-ink-900 mb-2">{t("Verified Trades")}</h3>
              <p className="text-xs text-ink-600 leading-relaxed">
                {t("Digital deal agreements, verified buyer credentials, and milestone audit trails.")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          J. FINAL CTA
          ================================================== */}
      <section className="py-20 sm:py-28 bg-white relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="relative rounded-3xl bg-gradient-to-br from-primary-900 via-primary-800 to-earth-900 p-8 sm:p-12 lg:p-16 text-center text-white shadow-2xl overflow-hidden">
            {/* Watermark Logo */}
            <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 opacity-10 pointer-events-none">
              <img src="/favicon.svg" alt="AgroConnect Mark" className="w-[500px] h-[500px]" />
            </div>

            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-primary-200 border border-white/20 mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              {t("Smart Agriculture for a Stronger India")}
            </span>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight max-w-3xl mx-auto leading-tight">
              {t("Your Next Selling Decision Starts Here.")}
            </h2>
            <p className="mt-4 text-base sm:text-lg text-earth-200 max-w-2xl mx-auto font-medium">
              {t("Join hundreds of progressive farmers, verified institutional buyers, and FPOs unlocking higher agricultural realization today.")}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="ac-btn-primary bg-white text-primary-900 hover:bg-earth-100 text-base font-bold py-4 px-8 shadow-lg transform transition hover:scale-105 active:scale-95">
                {t("Get Started Free")} →
              </Link>
              <Link to="/login" className="ac-btn-secondary bg-transparent text-white border-white/40 hover:bg-white/10 text-base font-bold py-4 px-8">
                {t("Sign In to Account")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          K. FOOTER
          ================================================== */}
      <footer className="bg-earth-900 text-earth-300 pt-16 pb-12 border-t border-earth-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-earth-800">
            <div className="md:col-span-2">
              <Link to="/">
                <Brand size="lg" textClassName="text-white" />
              </Link>
              <p className="mt-4 text-sm text-earth-400 max-w-md leading-relaxed">
                {t("AgroConnect is a data-driven agricultural market linkage platform helping farmers make optimal selling decisions through live market intelligence, transparent logistics math, and direct buyer linkages.")}
              </p>
              <div className="mt-6 flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-earth-800 px-3 py-1 text-xs font-semibold text-earth-300 border border-earth-700">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary-400" />
                  {t("AGMARKNET Verified Data")}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-earth-800 px-3 py-1 text-xs font-semibold text-earth-300 border border-earth-700">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary-400" />
                  {t("SIH Certified Architecture")}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white mb-4">{t("Navigation")}</p>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">{t("Features")}</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">{t("How It Works")}</a></li>
                <li><a href="#decision-support" className="hover:text-white transition-colors">{t("Decision Engine")}</a></li>
                <li><a href="#ecosystem" className="hover:text-white transition-colors">{t("Ecosystem Roles")}</a></li>
                <li><Link to="/marketplace" className="hover:text-white transition-colors">{t("Marketplace")}</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white mb-4">{t("Portals")}</p>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/login" className="hover:text-white transition-colors">{t("Farmer Login")}</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">{t("Buyer Login")}</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">{t("FPO Portal")}</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">{t("Register Account")}</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-earth-400">
            <p>© {new Date().getFullYear()} AgroConnect. {t("All rights reserved.")} {t("Built for Indian Agriculture.")}</p>
            <p>{t("Data sources:")} <span className="text-earth-300">AGMARKNET · data.gov.in · Ministry of Agriculture & Farmers Welfare</span></p>
          </div>
        </div>
      </footer>
    </div>
  )
}
