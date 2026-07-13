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

function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height
            height = maxHeight
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

function dataURLtoBlob(dataURL) {
  const byteString = atob(dataURL.split(',')[1])
  const mime = dataURL.split(',')[0].split(':')[1].split(';')[0]
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  return new Blob([ab], { type: mime })
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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
  const [notes, setNotes] = useState('')
  const [billImage, setBillImage] = useState(null)

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

  async function shareEntry(entry, blob, viaWhatsApp = false) {
    const text = `*Expense Receipt*\nSector: ${entry.sector}\nAmount: ${formatCurrency(entry.amount)}\nReason: ${entry.reason}${entry.transferredTo ? '\nTransferred to: ' + entry.transferredTo : ''}\nDate: ${formatDateTime(entry.timestamp)}`
    const files = [new File([blob], `receipt-${entry.id}.png`, { type: 'image/png' })]
    if (entry.billImage) {
      files.push(new File([dataURLtoBlob(entry.billImage)], `bill-${entry.id}.jpg`, { type: 'image/jpeg' }))
    }

    const canShareFiles = navigator.canShare && navigator.canShare({ files })

    if (canShareFiles) {
      try {
        await navigator.share({ files, text })
        return
      } catch {}
    }

    if (!viaWhatsApp && navigator.share) {
      try {
        await navigator.share({ text })
        return
      } catch {}
    }

    // Fallback: download images, then open WhatsApp with text
    downloadBlob(blob, `receipt-${entry.id}.png`)
    if (entry.billImage) {
      downloadBlob(dataURLtoBlob(entry.billImage), `bill-${entry.id}.jpg`)
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  function generateExpenseId() {
    const date = new Date()
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const rand = Math.floor(1000 + Math.random() * 9000)
    return `EXP-${y}${m}${d}-${rand}`
  }

  async function handleSave() {
    if (!selectedSector || !reason.trim() || !amount || Number(amount) <= 0) return

    const entry = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      expenseId: generateExpenseId(),
      sector: selectedSector,
      reason: reason.trim(),
      amount: Number(amount),
      transferredTo: transferredTo.trim(),
      notes: notes.trim(),
      timestamp: new Date(dateTime).toISOString(),
      billImage,
    }

    setEntries((prev) => [entry, ...prev])
    setReason('')
    setAmount('')
    setTransferredTo('')
    setNotes('')
    setDateTime(nowLocalInput())
    setBillImage(null)
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

  async function handleImageUpload(file) {
    if (!file) return
    const compressed = await compressImage(file, 800, 800, 0.7)
    setBillImage(compressed)
  }

  function handleClearImage() {
    setBillImage(null)
  }

  function handleDelete(entryId) {
    if (window.confirm('Delete this entry?')) {
      setEntries((prev) => prev.filter((e) => e.id !== entryId))
    }
  }

  async function shareLatestViaWhatsApp() {
    const entry = latestEntry
    if (!entry) return
    const blob = await generateImage(entry)
    if (blob) await shareEntry(entry, blob, true)
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
              notes={notes}
              billImage={billImage}
              canSubmit={!!selectedSector && !!reason.trim() && !!amount && Number(amount) > 0}
              onReasonChange={setReason}
              onAmountChange={setAmount}
              onTransferredToChange={setTransferredTo}
              onDateTimeChange={setDateTime}
              onNotesChange={setNotes}
              onImageChange={handleImageUpload}
              onClearImage={handleClearImage}
              onSubmit={handleSave}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">Receipt Preview</h2>
          <div className="pb-2">
            <ReceiptCard entry={latestEntry} compact />
          </div>
          {latestEntry && (
            <div className="fixed -left-[9999px] top-0">
              <ReceiptCard entry={latestEntry} ref={receiptRef} />
            </div>
          )}
          {latestEntry && (
            <button
              onClick={shareLatestViaWhatsApp}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.564 6.893H5.835a2.154 2.154 0 0 1-2.154-2.154V5.835A2.154 2.154 0 0 1 5.835 3.68h12.33a2.154 2.154 0 0 1 2.154 2.154v12.33a2.154 2.154 0 0 1-2.154 2.154z"/>
              </svg>
              Send via WhatsApp
            </button>
          )}
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
