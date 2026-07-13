import { Wallet } from 'lucide-react'

export default function ExpenseForm({
  reason,
  amount,
  transferredTo,
  dateTime,
  canSubmit,
  onReasonChange,
  onAmountChange,
  onTransferredToChange,
  onDateTimeChange,
  onSubmit,
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Reason</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="e.g. Cement delivery"
          className="w-full px-4 py-3.5 rounded-2xl bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none text-base transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Amount</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₹</span>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="0"
            className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none text-xl font-bold transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Transferred to <span className="text-slate-400 normal-case">(optional)</span></label>
        <input
          type="text"
          value={transferredTo}
          onChange={(e) => onTransferredToChange(e.target.value)}
          placeholder="Person or vendor name"
          className="w-full px-4 py-3.5 rounded-2xl bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none text-base transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Date & Time</label>
        <input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => onDateTimeChange(e.target.value)}
          className="w-full px-4 py-3.5 rounded-2xl bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none text-base transition-all"
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-lg shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2"
      >
        <Wallet size={22} /> Save Expense
      </button>
    </div>
  )
}
