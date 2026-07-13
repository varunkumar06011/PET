export default function Breakdown({ totalsBySector, total }) {
  if (totalsBySector.length === 0) return null

  return (
    <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Breakdown</h2>
      <div className="space-y-3">
        {totalsBySector.map(([sector, amount]) => (
          <div key={sector} className="flex justify-between items-center">
            <span className="text-sm text-slate-600">{sector}</span>
            <span className="text-sm font-bold text-slate-900">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
        <span className="font-bold text-slate-900">Total</span>
        <span className="text-lg font-bold text-emerald-600">
          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(total)}
        </span>
      </div>
    </section>
  )
}
