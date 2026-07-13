import { forwardRef, useEffect, useState } from 'react'
import {
  Briefcase,
  FileText,
  IndianRupee,
  User,
  Clock,
  StickyNote,
  Calendar,
  CheckCircle2,
  Download,
  Share2,
  MoreHorizontal,
} from 'lucide-react'
import QRCode from 'qrcode'

function ReceiptCard({ entry }, ref) {
  const [qrUrl, setQrUrl] = useState('')

  useEffect(() => {
    if (!entry?.expenseId) return
    QRCode.toDataURL(entry.expenseId, { width: 90, margin: 1, color: { dark: '#064e3b', light: '#ffffff' } })
      .then(setQrUrl)
      .catch(() => setQrUrl(''))
  }, [entry?.expenseId])

  if (!entry) {
    return (
      <div className="bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 p-8 text-center">
        <p className="text-sm text-slate-400">Your receipt preview will appear here</p>
      </div>
    )
  }

  const fmt = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n)

  const dateStr = new Date(entry.timestamp).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const timeStr = new Date(entry.timestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const savedAt = new Date(entry.timestamp).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const rows = [
    { icon: Briefcase, color: 'bg-emerald-600', label: 'BUSINESS', value: entry.sector },
    { icon: FileText, color: 'bg-blue-500', label: 'REASON', value: entry.reason },
    { icon: IndianRupee, color: 'bg-amber-500', label: 'AMOUNT', value: fmt(entry.amount), big: true, green: true },
    { icon: User, color: 'bg-violet-500', label: 'TRANSFERRED TO', value: entry.transferredTo || '-' },
    { icon: Clock, color: 'bg-sky-500', label: 'DATE & TIME', value: `${dateStr} ${timeStr}` },
    { icon: StickyNote, color: 'bg-slate-500', label: 'NOTES', value: entry.notes || '-' },
  ]

  return (
    <div
      ref={ref}
      className="bg-white rounded-[32px] p-6 w-[760px] max-w-none shadow-xl border border-slate-100"
      style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-2xl shadow-md">
            VK
          </div>
          <div className="pt-1">
            <h2 className="text-2xl font-bold text-slate-900 tracking-wide">VINOD KUMAR</h2>
            <p className="text-sm text-slate-500 font-medium">Expense Record</p>
            <div className="h-1 w-12 bg-emerald-600 rounded-full mt-2" />
          </div>
        </div>
      </div>

      {/* Top info row */}
      <div className="flex items-center justify-between bg-emerald-50/60 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
            <Briefcase size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expense ID</p>
            <p className="text-sm font-bold text-slate-900">{entry.expenseId || entry.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600">
            <Calendar size={18} />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</p>
            <p className="text-sm font-bold text-slate-900">{dateStr}</p>
            <p className="text-xs text-slate-500">{timeStr}</p>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-2 gap-5 mb-6">
        {/* Details card */}
        <div className="bg-slate-50 rounded-3xl p-5 space-y-4">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start gap-3 pb-3 border-b border-slate-200 last:border-0 last:pb-0">
              <div className={`w-10 h-10 rounded-full ${row.color} flex items-center justify-center text-white shrink-0`}>
                <row.icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{row.label}</p>
                <p className={`font-semibold text-slate-900 truncate ${row.big ? 'text-xl mt-0.5' : 'text-sm mt-0.5'} ${row.green ? 'text-emerald-700' : ''}`}>
                  {row.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bill image card */}
        <div className="bg-emerald-50/40 rounded-3xl p-5 border border-emerald-100 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Share2 size={16} className="text-emerald-700" />
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Bill / Receipt</p>
          </div>
          {entry.billImage ? (
            <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200 bg-white">
              <img src={entry.billImage} alt="Bill" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="flex-1 rounded-2xl border-2 border-dashed border-emerald-200 flex flex-col items-center justify-center text-emerald-600/70 bg-white">
              <FileText size={40} />
              <p className="text-sm font-medium mt-2">No bill image attached</p>
            </div>
          )}
        </div>
      </div>

      {/* Saved banner */}
      <div className="flex items-center justify-between bg-emerald-50 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={28} className="text-emerald-600" />
          <div>
            <p className="text-sm font-bold text-emerald-700 uppercase tracking-wider">Expense Saved Successfully</p>
            <p className="text-xs text-slate-500">on {savedAt}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-emerald-700 italic" style={{ fontFamily: "'Brush Script MT', cursive" }}>Vinod Kumar</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Founder</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-50 text-emerald-700 font-semibold text-sm border border-emerald-100">
          <Download size={18} /> Download Image
        </div>
        <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 text-white font-semibold text-sm shadow-md shadow-emerald-200">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.564 6.893H5.835a2.154 2.154 0 0 1-2.154-2.154V5.835A2.154 2.154 0 0 1 5.835 3.68h12.33a2.154 2.154 0 0 1 2.154 2.154v12.33a2.154 2.154 0 0 1-2.154 2.154z"/>
          </svg>
          Share on WhatsApp
        </div>
        <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-violet-50 text-violet-700 font-semibold text-sm border border-violet-100">
          <MoreHorizontal size={18} /> More Options
        </div>
      </div>

      {/* Footer quote + QR */}
      <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4">
        <div className="flex items-start gap-3 max-w-md">
          <span className="text-3xl text-slate-300 leading-none">“</span>
          <p className="text-sm text-slate-600 italic">Track every rupee. Build every dream.</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">– Vinod Kumar</p>
        </div>
        {qrUrl && (
          <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <img src={qrUrl} alt="QR" className="w-20 h-20" />
          </div>
        )}
      </div>
    </div>
  )
}

export default forwardRef(ReceiptCard)
