import { useLanguage } from '../hooks/LanguageContext.jsx'

/**
 * DealPipeline.jsx — visual escrow & execution timeline for a deal.
 * Step-by-step pipeline: Contract Agreed → Quality Verification → Escrow Funded → Dispatched → Payment Released.
 */
export default function DealPipeline({ deliveryStatus, paymentStatus }) {
  const { t } = useLanguage()

  // Determine the active step based on delivery and payment statuses.
  // 1. Contract Agreed (Default)
  // 2. Quality Verification -> If deliveryStatus is PREPARING
  // 3. Escrow Funded -> If paymentStatus is PARTIAL or PAID
  // 4. Dispatched -> If deliveryStatus is IN_TRANSIT or DELIVERED
  // 5. Payment Released -> If paymentStatus is PAID and deliveryStatus is COMPLETED

  let currentStepIndex = 0

  if (deliveryStatus === 'COMPLETED' && paymentStatus === 'PAID') {
    currentStepIndex = 4
  } else if (deliveryStatus === 'IN_TRANSIT' || deliveryStatus === 'DELIVERED') {
    currentStepIndex = 3
  } else if (paymentStatus === 'PARTIAL' || paymentStatus === 'PAID') {
    currentStepIndex = 2
  } else if (deliveryStatus === 'PREPARING') {
    currentStepIndex = 1
  }

  const steps = [
    { label: "Contract Agreed", detail: "Terms accepted" },
    { label: "Quality Verification", detail: "Goods inspected" },
    { label: "Escrow Funded", detail: "Funds secured" },
    { label: "Dispatched", detail: "In transit" },
    { label: "Payment Released", detail: "Settled" },
  ]

  return (
    <div className="ac-card p-6 bg-white mb-6">
      <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-6">{t("Escrow & Execution Pipeline")}</h3>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-earth-200 -z-10 hidden md:block -translate-y-1/2 rounded"></div>
        {steps.map((step, idx) => {
          const isActive = idx <= currentStepIndex
          const isCurrent = idx === currentStepIndex
          return (
            <div key={step.label} className="flex md:flex-col items-center gap-4 md:gap-3 z-10 w-full md:w-auto relative mb-4 md:mb-0">
              {/* Vertical line for mobile */}
              {idx < steps.length - 1 && (
                <div className="absolute left-4 top-8 w-0.5 h-full bg-earth-200 md:hidden z-[-1]"></div>
              )}
              {/* Colored vertical line for mobile */}
              {idx < currentStepIndex && (
                <div className="absolute left-4 top-8 w-0.5 h-full bg-success-500 md:hidden z-[-1]"></div>
              )}

              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                isActive
                  ? 'bg-success-500 border-success-500 text-white'
                  : 'bg-white border-earth-300 text-ink-400'
              }`}>
                {isActive ? '✓' : idx + 1}
              </div>
              <div className="md:text-center">
                <p className={`text-sm font-bold ${isActive ? 'text-ink-900' : 'text-ink-400'}`}>{t(step.label)}</p>
                <p className="text-[10px] text-ink-500 uppercase tracking-wider mt-0.5">{t(step.detail)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
