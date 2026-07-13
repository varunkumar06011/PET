import { useEffect, useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { Plus, Share, Download, Calendar, Trash2, Wallet, ArrowUpRight, History } from 'lucide-react'

const DEFAULT_SECTORS = [
  'VGrand Restaurant',
  'VGrand Infra',
  'VGrand Healthcare',
  'Mining',
  'Softshape.ai',
]

const STORAGE_KEYS = {
  entries: 'pet_entries_v1',
  sectors: 'pet_sectors_v1',
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDateTime(iso) {
  const d = new Date(iso)
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

function nowLocalInput() {
  const d = new Date()
  d.setSeconds(0, 0)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function startOfDay(iso) {
  const d = new Date(iso)
  d.setHours(0, 0, 0, 0)
  return d
}

function isSameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

export default function App() {
  const [entries, setEntries] = useState(() => loadJSON(STORAGE_KEYS.entries, []))
  const [sectors, setSectors] = useState(() => loadJSON(STORAGE_KEYS.sectors, DEFAULT_SECTORS))

  const [selectedSector, setSelectedSector] = useState(sectors[0] || '')
  const [reason, setReason] = useState('')
  const [amount, setAmount] = useState('')
  const [transferredTo, setTransferredTo] = useState('')
  const [dateTime, setDateTime] = useState(() => nowLocalInput())

  const [filterPreset, setFilterPreset] = useState('today')
  const [customStart, setCustomStart] = useState(() => nowLocalInput().slice(0, 10))
  const [customEnd, setCustomEnd] = useState(() => nowLocalInput().slice(0, 10))

  const [justSaved, setJustSaved] = useState(null)
  const receiptRef = useRef(null)

  useEffect(() => {
    saveJSON(STORAGE_KEYS.entries, entries)
  }, [entries])

  useEffect(() => {
    saveJSON(STORAGE_KEYS.sectors, sectors)
    if (!sectors.includes(selectedSector)) {
      setSelectedSector(sectors[0] || '')
    }
  }, [sectors, selectedSector])

  const filteredEntries = useMemo(() => {
    const now = new Date()
    let start = startOfDay(now)
    let end = new Date(now)
    end.setHours(23, 59, 59, 999)

    if (filterPreset === 'week') {
      start = new Date(now)
      start.setDate(now.getDate() - now.getDay())
      start.setHours(0, 0, 0, 0)
    } else if (filterPreset === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (filterPreset === 'custom') {
      start = new Date(customStart)
      start.setHours(0, 0, 0, 0)
      end = new Date(customEnd)
      end.setHours(23, 59, 59, 999)
    }

    return entries.filter((e) => {
      const t = new Date(e.timestamp).getTime()
      return t >= start.getTime() && t <= end.getTime()
    })
  }, [entries, filterPreset, customStart, customEnd])

  const totalsBySector = useMemo(() => {
    const map = {}
    for (const s of sectors) map[s] = 0
    for (const e of filteredEntries) {
      map[e.sector] = (map[e.sector] || 0) + Number(e.amount)
    }
    return Object.entries(map)
      .filter(([_, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
  }, [filteredEntries, sectors])

  const total = useMemo(
    () => filteredEntries.reduce((sum, e) => sum + Number(e.amount), 0),
    [filteredEntries]
  )

  const groupedHistory = useMemo(() => {
    const days = {}
    for (const e of filteredEntries.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))) {
      const key = new Date(e.timestamp).toDateString()
      days[key] = days[key] || []
      days[key].push(e)
    }
    return Object.entries(days)
  }, [filteredEntries])

  function handleAddSector() {
    const name = window.prompt('New sector name')
    if (name && !sectors.includes(name.trim())) {
      const updated = [...sectors, name.trim()]
      setSectors(updated)
      setSelectedSector(name.trim())
    }
  }

  async function generateImage(entry) {
    if (!receiptRef.current) return null
    const canvas = await html2canvas(receiptRef.current, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    })
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function shareEntry(entry, blob) {
    const text = `*Expense Receipt*\nSector: ${entry.sector}\nAmount: ${formatCurrency(entry.amount)}\nReason: ${entry.reason}${entry.transferredTo ? '\nTransferred to: ' + entry.transferredTo : ''}\nDate: ${formatDateTime(entry.timestamp)}`
    const file = new File([blob], `receipt-${entry.id}.png`, { type: 'image/png' })

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text })
        return
      } catch {}
    }

    if (navigator.share) {
      try {
        await navigator.share({ text })
        return
      } catch {}
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  async function handleSave() {
    if (!selectedSector || !reason.trim() || !amount || Number(amount) <= 0) return

    const entry = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      sector: selectedSector,
      reason: reason.trim(),
      amount: Number(amount),
      transferredTo: transferredTo.trim(),
      timestamp: new Date(dateTime).toISOString(),
    }

    setEntries((prev) => [entry, ...prev])
    setReason('')
    setAmount('')
    setTransferredTo('')
    setDateTime(nowLocalInput())
    setJustSaved(entry)

    // Wait for receipt DOM to update, then generate image and download
    setTimeout(async () => {
      const blob = await generateImage(entry)
      if (blob) {
        downloadBlob(blob, `receipt-${entry.id}.png`)
      }
    }, 100)
  }

  async function handleSharePast(entry) {
    setJustSaved(entry)
    setTimeout(async () => {
      const blob = await generateImage(entry)
      if (blob) await shareEntry(entry, blob)
    }, 100)
  }

  function handleDelete(entryId) {
    if (window.confirm('Delete this entry?')) {
      setEntries((prev) => prev.filter((e) => e.id !== entryId))
    }
  }

  const latestEntry = justSaved || entries[0]

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <header className="bg-white border-b border-neutral-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">Expenses</h1>
            <p className="text-xs text-neutral-500">Vinod Kumar</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-500">Total ({filterPreset === 'today' ? 'Today' : filterPreset === 'week' ? 'This Week' : filterPreset === 'month' ? 'This Month' : 'Range'})</p>
            <p className="text-xl font-bold text-brand-600">{formatCurrency(total)}</p>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Entry form */}
        <section className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-4">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar mb-4 pb-1">
            {sectors.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSector(s)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedSector === s
                    ? 'bg-brand-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {s}
              </button>
            ))}
            <button
              onClick={handleAddSector}
              className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium bg-neutral-900 text-white hover:bg-neutral-800 shrink-0"
            >
              <Plus size={16} /> New
            </button>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason — e.g. Cement delivery"
              className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-base"
            />

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">₹</span>
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-lg font-semibold"
              />
            </div>

            <input
              type="text"
              value={transferredTo}
              onChange={(e) => setTransferredTo(e.target.value)}
              placeholder="Transferred to (optional)"
              className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-base"
            />

            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-base"
            />

            <button
              onClick={handleSave}
              disabled={!selectedSector || !reason.trim() || !amount || Number(amount) <= 0}
              className="w-full py-4 rounded-xl bg-brand-600 text-white font-semibold text-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Wallet size={20} /> Save Expense
            </button>
          </div>
        </section>

        {/* Receipt card used for image generation */}
        {latestEntry && (
          <div
            ref={receiptRef}
            className="fixed -left-[9999px] top-0 w-80 bg-white p-6 border border-neutral-200"
            style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
          >
            <div className="text-center border-b-2 border-dashed border-neutral-300 pb-4 mb-4">
              <h2 className="text-lg font-bold text-neutral-900">Expense Receipt</h2>
              <p className="text-xs text-neutral-500">Vinod Kumar</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-neutral-500">Sector</span><span className="font-medium text-right max-w-[55%]">{latestEntry.sector}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Amount</span><span className="font-bold text-brand-600">{formatCurrency(latestEntry.amount)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Reason</span><span className="font-medium text-right max-w-[55%]">{latestEntry.reason}</span></div>
              {latestEntry.transferredTo && (
                <div className="flex justify-between"><span className="text-neutral-500">Transferred to</span><span className="font-medium text-right max-w-[55%]">{latestEntry.transferredTo}</span></div>
              )}
              <div className="flex justify-between"><span className="text-neutral-500">Date</span><span className="font-medium">{formatDateTime(latestEntry.timestamp)}</span></div>
            </div>
            <div className="mt-6 pt-4 border-t-2 border-dashed border-neutral-300 text-center text-xs text-neutral-400">
              Generated by Personal Expenditure Tracker
            </div>
          </div>
        )}

        {/* Daily report card */}
        <section className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-4">
          <h2 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
            <Calendar size={16} /> Daily Report
          </h2>
          <DailyReport entries={entries} sectors={sectors} onShare={shareEntry} />
        </section>

        {/* Filters */}
        <section className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-1">
          {[
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'This Week' },
            { key: 'month', label: 'This Month' },
            { key: 'custom', label: 'Custom' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setFilterPreset(p.key)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                filterPreset === p.key
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
              }`}
            >
              {p.label}
            </button>
          ))}
        </section>

        {filterPreset === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 text-sm"
            />
            <span className="text-neutral-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 text-sm"
            />
          </div>
        )}

        {/* Breakdown */}
        {totalsBySector.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-4">
            <h2 className="text-sm font-semibold text-neutral-700 mb-3">Breakdown</h2>
            <div className="space-y-2">
              {totalsBySector.map(([sector, amount]) => (
                <div key={sector} className="flex justify-between items-center">
                  <span className="text-sm text-neutral-700">{sector}</span>
                  <span className="text-sm font-semibold">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-neutral-100 flex justify-between items-center">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-brand-600">{formatCurrency(total)}</span>
            </div>
          </section>
        )}

        {/* History */}
        <section>
          <h2 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
            <History size={16} /> History
          </h2>
          {groupedHistory.length === 0 ? (
            <p className="text-center text-neutral-400 py-10 text-sm">No expenses in this range.</p>
          ) : (
            <div className="space-y-4">
              {groupedHistory.map(([day, items]) => (
                <div key={day} className="space-y-2">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide pl-1">
                    {formatDate(items[0].timestamp)}
                  </p>
                  <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
                    {items.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-4 border-b border-neutral-100 last:border-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-neutral-900 truncate">{entry.reason}</p>
                          <p className="text-xs text-neutral-500 truncate">{entry.sector}{entry.transferredTo ? ` · ${entry.transferredTo}` : ''}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-2">
                          <p className="font-bold text-brand-600 whitespace-nowrap">{formatCurrency(entry.amount)}</p>
                          <button
                            onClick={() => handleSharePast(entry)}
                            className="p-2 rounded-full bg-neutral-100 text-neutral-700 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                            aria-label="Share"
                          >
                            <Share size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-2 rounded-full bg-neutral-100 text-neutral-700 hover:bg-red-50 hover:text-red-600 transition-colors"
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
          )}
        </section>
      </main>
    </div>
  )
}

function DailyReport({ entries, sectors, onShare }) {
  const today = useMemo(() => {
    return entries.filter((e) => isSameDay(e.timestamp, new Date()))
  }, [entries])

  const todayTotal = today.reduce((sum, e) => sum + Number(e.amount), 0)
  const breakdown = useMemo(() => {
    const map = {}
    for (const s of sectors) map[s] = 0
    for (const e of today) map[e.sector] = (map[e.sector] || 0) + Number(e.amount)
    return Object.entries(map).filter(([_, v]) => v > 0)
  }, [today, sectors])

  if (today.length === 0) {
    return <p className="text-sm text-neutral-400">No expenses recorded today yet.</p>
  }

  const text = `*Daily Expense Report — ${new Date().toLocaleDateString('en-IN')}*\n\n${breakdown
    .map(([s, a]) => `${s}: ${formatCurrency(a)}`)
    .join('\n')}\n\n*Total: ${formatCurrency(todayTotal)}*`

  return (
    <div className="space-y-3">
      <div className="bg-neutral-50 rounded-xl p-3 text-sm space-y-1">
        {breakdown.map(([sector, amount]) => (
          <div key={sector} className="flex justify-between">
            <span className="text-neutral-600">{sector}</span>
            <span className="font-medium">{formatCurrency(amount)}</span>
          </div>
        ))}
        <div className="pt-2 border-t border-neutral-200 flex justify-between font-bold">
          <span>Total</span>
          <span className="text-brand-600">{formatCurrency(todayTotal)}</span>
        </div>
      </div>
      <button
        onClick={async () => {
          if (navigator.share) {
            try {
              await navigator.share({ text })
              return
            } catch {}
          }
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
        }}
        className="w-full py-3 rounded-xl border border-brand-200 bg-brand-50 text-brand-700 font-medium flex items-center justify-center gap-2 hover:bg-brand-100 transition-colors"
      >
        <ArrowUpRight size={18} /> Share today's report
      </button>
    </div>
  )
}
