import { forwardRef } from 'react'

function ReceiptCard({ entry }, ref) {
  if (!entry) {
    return (
      <div className="bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 p-8 text-center">
        <p className="text-sm text-slate-400">Your receipt preview will appear here</p>
      </div>
    )
  }

  const fmt = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
  const dt = new Date(entry.timestamp).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div
      ref={ref}
      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
      style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      <div className="text-center border-b-2 border-dashed border-slate-300 pb-4 mb-4">
        <h3 className="text-lg font-bold text-slate-900">Expense Receipt</h3>
        <p className="text-xs text-slate-500 mt-0.5">Vinod Kumar</p>
      </div>
      <div className="space-y-2.5 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Sector</span>
          <span className="font-semibold text-slate-900 text-right">{entry.sector}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Amount</span>
          <span className="font-bold text-emerald-600 text-lg">{fmt(entry.amount)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Reason</span>
          <span className="font-semibold text-slate-900 text-right">{entry.reason}</span>
        </div>
        {entry.transferredTo && (
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Transferred to</span>
            <span className="font-semibold text-slate-900 text-right">{entry.transferredTo}</span>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Date</span>
          <span className="font-semibold text-slate-900 text-right">{dt}</span>
        </div>
      </div>
      <div className="mt-5 pt-4 border-t-2 border-dashed border-slate-300 text-center text-[10px] text-slate-400 uppercase tracking-wider">
        Personal Expenditure Tracker
      </div>
    </div>
  )
}

export default forwardRef(ReceiptCard)
