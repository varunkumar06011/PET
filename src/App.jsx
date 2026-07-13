import { useEffect, useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { subscribe, saveEntries, saveSectors, seedFromLocalStorage } from './db.js'
import Header from './components/Header.jsx'
import SectorChips from './components/SectorChips.jsx'
import ExpenseForm from './components/ExpenseForm.jsx'
import ReceiptCard from './components/ReceiptCard.jsx'
import FilterTabs from './components/FilterTabs.jsx'
import Breakdown from './components/Breakdown.jsx'
import DailyReport from './components/DailyReport.jsx'
import History from './components/History.jsx'
import SearchBar from './components/SearchBar.jsx'

const DEFAULT_SECTORS = [
  'VGrand Restaurant',
  'VGrand Infra',
  'VGrand Healthcare',
  'Mining',
  'Softshape.ai',
]

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
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

export default function App() {
  const [entries, setEntries] = useState([])
  const [sectors, setSectors] = useState(DEFAULT_SECTORS)
  const [loading, setLoading] = useState(true)

  const [selectedSector, setSelectedSector] = useState(DEFAULT_SECTORS[0] || '')
  const [reason, setReason] = useState('')
  const [amount, setAmount] = useState('')
  const [transferredTo, setTransferredTo] = useState('')
  const [dateTime, setDateTime] = useState(() => nowLocalInput())

  const [filterPreset, setFilterPreset] = useState('today')
  const [customStart, setCustomStart] = useState(() => nowLocalInput().slice(0, 10))
  const [customEnd, setCustomEnd] = useState(() => nowLocalInput().slice(0, 10))
  const [searchQuery, setSearchQuery] = useState('')

  const [justSaved, setJustSaved] = useState(null)
  const receiptRef = useRef(null)

  useEffect(() => {
    let mounted = true
    let unsub = () => {}

    seedFromLocalStorage(DEFAULT_SECTORS).then(() => {
      if (!mounted) return
      unsub = subscribe((data) => {
        setEntries(data.entries || [])
        if (data.sectors) setSectors(data.sectors)
        setLoading(false)
      })
    })

    return () => {
      mounted = false
      unsub()
    }
  }, [])

  useEffect(() => {
    saveEntries(entries)
  }, [entries])

  useEffect(() => {
    saveSectors(sectors)
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

  const searchedEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return filteredEntries
    return filteredEntries.filter((e) =>
      e.reason.toLowerCase().includes(q) ||
      e.sector.toLowerCase().includes(q) ||
      (e.transferredTo && e.transferredTo.toLowerCase().includes(q))
    )
  }, [filteredEntries, searchQuery])

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
  const filterLabel = filterPreset === 'today' ? 'Today' : filterPreset === 'week' ? 'This Week' : filterPreset === 'month' ? 'This Month' : 'Range'

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 text-sm font-medium">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Header total={formatCurrency(total)} filterLabel={filterLabel} />

      <main className="max-w-md mx-auto px-4 pt-5 space-y-6">
        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
          <SectorChips
            sectors={sectors}
            selected={selectedSector}
            onSelect={setSelectedSector}
            onAdd={handleAddSector}
          />
          <div className="mt-5">
            <ExpenseForm
              reason={reason}
              amount={amount}
              transferredTo={transferredTo}
              dateTime={dateTime}
              canSubmit={!!selectedSector && !!reason.trim() && !!amount && Number(amount) > 0}
              onReasonChange={setReason}
              onAmountChange={setAmount}
              onTransferredToChange={setTransferredTo}
              onDateTimeChange={setDateTime}
              onSubmit={handleSave}
            />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Receipt Preview</h2>
          <ReceiptCard entry={latestEntry} ref={receiptRef} />
        </section>

        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Daily Report</h2>
          <DailyReport entries={entries} sectors={sectors} />
        </section>

        <FilterTabs active={filterPreset} onChange={setFilterPreset} />

        {filterPreset === 'custom' && (
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none"
            />
            <span className="text-slate-400 text-sm">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none"
            />
          </div>
        )}

        <Breakdown totalsBySector={totalsBySector} total={total} />

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">History</h2>
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <History entries={searchedEntries} onShare={handleSharePast} onDelete={handleDelete} />
        </section>
      </main>
    </div>
  )
}
