export default function FilterTabs({ active, onChange }) {
  const presets = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'custom', label: 'Custom' },
  ]

  return (
    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
      {presets.map((p) => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          className={`whitespace-nowrap px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
            active === p.key
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-400 hover:text-emerald-600'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
