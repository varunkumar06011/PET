import { useMemo } from 'react'
import { ArrowUpRight, CalendarDays } from 'lucide-react'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function startOfDay(iso) {
  const d = new Date(iso)
  d.setHours(0, 0, 0, 0)
  return d
}

function isSameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

export default function DailyReport({ entries, sectors }) {
  const today = useMemo(() => entries.filter((e) => isSameDay(e.timestamp, new Date())), [entries])
  const total = today.reduce((sum, e) => sum + Number(e.amount), 0)
  const breakdown = useMemo(() => {
    const map = {}
    for (const s of sectors) map[s] = 0
    for (const e of today) map[e.sector] = (map[e.sector] || 0) + Number(e.amount)
    return Object.entries(map).filter(([_, v]) => v > 0)
  }, [today, sectors])

  const text = `*Daily Expense Report — ${new Date().toLocaleDateString('en-IN')}*\n\n${breakdown
    .map(([s, a]) => `${s}: ${formatCurrency(a)}`)
    .join('\n')}\n\n*Total: ${formatCurrency(total)}*`

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ text })
        return
      } catch {}
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  if (today.length === 0) {
    return (
      <div className="flex items-start gap-3 text-slate-400">
        <CalendarDays size={18} className="mt-0.5" />
        <p className="text-sm">No expenses recorded today yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
        {breakdown.map(([sector, amount]) => (
          <div key={sector} className="flex justify-between items-center">
            <span className="text-sm text-slate-600">{sector}</span>
            <span className="text-sm font-bold text-slate-900">{formatCurrency(amount)}</span>
          </div>
        ))}
        <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
          <span className="font-bold text-slate-900">Total</span>
          <span className="text-lg font-bold text-emerald-600">{formatCurrency(total)}</span>
        </div>
      </div>
      <button
        onClick={share}
        className="w-full py-3.5 rounded-2xl bg-slate-900 text-white font-semibold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
      >
        <ArrowUpRight size={18} /> Share today's report
      </button>
    </div>
  )
}
