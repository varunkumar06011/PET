import { Wallet, ImagePlus, X } from 'lucide-react'

export default function ExpenseForm({
  reason,
  amount,
  transferredTo,
  dateTime,
  billImage,
  canSubmit,
  onReasonChange,
  onAmountChange,
  onTransferredToChange,
  onDateTimeChange,
  onImageChange,
  onClearImage,
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
            min="0"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value.replace(/^-/, ''))}
            onWheel={(e) => e.target.blur()}
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

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Bill Image <span className="text-slate-400 normal-case">(optional)</span></label>
        {billImage ? (
          <div className="relative rounded-2xl overflow-hidden border border-slate-200">
            <img src={billImage} alt="Bill preview" className="w-full h-40 object-cover" />
            <button
              type="button"
              onClick={onClearImage}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors"
              aria-label="Remove bill image"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full py-6 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer">
            <ImagePlus size={28} />
            <span className="text-sm font-medium mt-2">Upload bill photo</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onImageChange(e.target.files[0])}
            />
          </label>
        )}
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
