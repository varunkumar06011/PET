import { Plus } from 'lucide-react'

export default function SectorChips({ sectors, selected, onSelect, onAdd }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
      {sectors.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className={`whitespace-nowrap px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
            selected === s
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {s}
        </button>
      ))}
      <button
        onClick={onAdd}
        className="flex items-center gap-1 px-4 py-2.5 rounded-full text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 shrink-0 transition-colors"
      >
        <Plus size={16} /> New
      </button>
    </div>
  )
}
