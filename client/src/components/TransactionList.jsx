import { ArrowUpRight, ArrowDownRight, Trash2 } from 'lucide-react'

const TransactionList = ({ transactions }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <h3 className="text-xl font-bold text-white mb-6">Últimos Movimientos</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-800">
              <th className="pb-4 font-medium">Concepto</th>
              <th className="pb-4 font-medium">Cuenta</th>
              <th className="pb-4 font-medium">Fecha</th>
              <th className="pb-4 font-medium text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-8 text-slate-500">
                  No hay movimientos recientes
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="group hover:bg-slate-800/50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${t.amount > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {t.amount > 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                      </div>
                      <span className="font-medium text-slate-200">{t.description}</span>
                    </div>
                  </td>
                  <td className="py-4 text-slate-400 text-sm">
                    {t.account ? t.account.name : 'Cuenta eliminada'}
                  </td>
                  <td className="py-4 text-slate-500 text-sm">
                    {/* Formateamos la fecha simple */}
                    {new Date().toLocaleDateString()} 
                  </td>
                  <td className={`py-4 text-right font-bold ${t.amount > 0 ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {t.amount > 0 ? '+' : ''}${t.amount.toLocaleString('es-AR')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TransactionList