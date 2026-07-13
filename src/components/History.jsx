import { Share, Trash2, History as HistoryIcon, Receipt } from 'lucide-react'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function ExpenseHistory({ entries, onShare, onDelete }) {
  const days = {}
  for (const e of entries.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))) {
    const key = new Date(e.timestamp).toDateString()
    days[key] = days[key] || []
    days[key].push(e)
  }
  const grouped = Object.entries(days)

  if (grouped.length === 0) {
    return (
      <div className="text-center py-12">
        <Receipt size={40} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-400 text-sm">No expenses in this range.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {grouped.map(([day, items]) => (
        <div key={day}>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">{formatDate(items[0].timestamp)}</p>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            {items.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <p className="font-semibold text-slate-900 truncate">{entry.reason}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {entry.sector}
                    {entry.transferredTo ? ` · ${entry.transferredTo}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-emerald-600 whitespace-nowrap">{formatCurrency(entry.amount)}</p>
                  <button
                    onClick={() => onShare(entry)}
                    className="p-2.5 rounded-full bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    aria-label="Share"
                  >
                    <Share size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(entry.id)}
                    className="p-2.5 rounded-full bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
