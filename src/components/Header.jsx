import { firebaseEnabled } from '../firebase.js'

export default function Header({ total, filterLabel }) {
  const online = typeof navigator !== 'undefined' && navigator.onLine
  const syncing = firebaseEnabled && online

  return (
    <header className="bg-gradient-to-br from-slate-900 to-slate-800 text-white sticky top-0 z-20">
      <div className="max-w-md mx-auto px-5 py-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-300 uppercase tracking-wider">Vinod Kumar</p>
            <h1 className="text-2xl font-bold mt-0.5">Expenses</h1>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium text-slate-300 uppercase tracking-wider">Total ({filterLabel})</p>
            <p className="text-2xl font-bold text-emerald-400 mt-0.5">{total}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-end gap-2">
          <span className={`w-2 h-2 rounded-full ${syncing ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-[10px] font-medium text-slate-300">
            {syncing ? 'Cloud sync on' : online ? 'Local only' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  )
}
