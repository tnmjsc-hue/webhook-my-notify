import { PLANS, type PlanName } from '@/lib/plans'

export function PlanCard({
  name,
  current,
  cta,
}: {
  name: PlanName
  current?: PlanName
  cta?: React.ReactNode
}) {
  const plan = PLANS[name]
  const isCurrent = current === name

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 transition-shadow ${
        plan.popular
          ? 'border-zinc-900 dark:border-white shadow-xl shadow-zinc-900/5'
          : 'border-zinc-200 dark:border-zinc-800'
      } bg-white dark:bg-zinc-900`}
    >
      {plan.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold px-3 py-0.5 rounded-full whitespace-nowrap">
          PHỔ BIẾN
        </span>
      )}
      {isCurrent && (
        <span className="absolute -top-3 right-4 bg-green-600 text-white text-xs font-bold px-3 py-0.5 rounded-full">
          GÓI HIỆN TẠI
        </span>
      )}

      <h4 className="text-lg font-bold text-zinc-900 dark:text-white">{plan.label}</h4>
      <p className="text-sm text-zinc-500 mt-1">{plan.tagline}</p>
      <p className="mt-4 text-4xl font-bold text-zinc-900 dark:text-white">
        {plan.priceLabel}
        <span className="text-sm font-normal text-zinc-500">/tháng</span>
      </p>

      <ul className="mt-6 space-y-2.5 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <svg className="w-4 h-4 mt-0.5 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        {cta ?? (
          <button
            disabled={isCurrent}
            className={`w-full text-center py-2.5 rounded-xl text-sm font-medium transition-opacity ${
              plan.popular
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90'
                : 'border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isCurrent ? 'Gói hiện tại' : 'Chọn gói này'}
          </button>
        )}
      </div>
    </div>
  )
}
