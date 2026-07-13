export default function Header({ total, filterLabel }) {
  return (
    <header className="bg-gradient-to-br from-slate-900 to-slate-800 text-white sticky top-0 z-20">
      <div className="max-w-md mx-auto px-5 py-5 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium text-slate-300 uppercase tracking-wider">Vinod Kumar</p>
          <h1 className="text-2xl font-bold mt-0.5">Expenses</h1>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium text-slate-300 uppercase tracking-wider">Total ({filterLabel})</p>
          <p className="text-2xl font-bold text-emerald-400 mt-0.5">{total}</p>
        </div>
      </div>
    </header>
  )
}
