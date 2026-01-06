import { useState, useEffect } from 'react'
import { X, Check, Calendar, Info } from 'lucide-react' // Agregué Info

const TransactionModal = ({ isOpen, onClose, onSubmit, accounts, categories = [] }) => {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    account_id: '',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense'
  })

  // 1. Detectar cuenta seleccionada para saber la moneda
  const selectedAccount = accounts.find(a => a.id == formData.account_id)
  const isUSD = selectedAccount?.currency === 'USD'
  const currencySymbol = isUSD ? 'U$S' : '$'

  useEffect(() => {
    if (isOpen && accounts.length > 0 && categories.length > 0) {
      // Si no hay cuenta seleccionada, seleccionamos la primera
      if (!formData.account_id) {
          setFormData(prev => ({ ...prev, account_id: accounts[0].id, category_id: categories[0].id }))
      }
    }
  }, [isOpen, accounts, categories])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.category_id) return alert("Falta categoría")
    
    const finalAmount = formData.type === 'expense' ? -Math.abs(parseFloat(formData.amount)) : Math.abs(parseFloat(formData.amount))
    onSubmit({ ...formData, amount: finalAmount })
    
    // Resetear form (opcional, manteniendo fecha y cuenta)
    setFormData(prev => ({ ...prev, amount: '', description: '' }))
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        
        {/* HEADER TUYO */}
        <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
          <h3 className="text-white font-bold text-lg">Nuevo Movimiento</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* BOTONES GASTO/INGRESO TUYOS */}
          <div className="flex bg-slate-800 p-1 rounded-lg">
            <button type="button" onClick={() => setFormData({...formData, type: 'expense'})} className={`flex-1 py-2 rounded-md text-sm font-medium transition ${formData.type === 'expense' ? 'bg-red-500/20 text-red-400' : 'text-slate-400'}`}>Gasto</button>
            <button type="button" onClick={() => setFormData({...formData, type: 'income'})} className={`flex-1 py-2 rounded-md text-sm font-medium transition ${formData.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'}`}>Ingreso</button>
          </div>

          {/* FECHA (Con tu fix del calendario) */}
          <div>
            <label className="block text-slate-400 text-sm mb-1">Fecha</label>
            <div className="relative">
                <Calendar className="absolute left-3 top-3 text-slate-500 pointer-events-none" size={18} />
                <input 
                  type="date" 
                  required 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pl-10 text-white outline-none focus:border-blue-500 cursor-pointer"
                  value={formData.date} 
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  onClick={(e) => e.target.showPicker()}
                />
            </div>
          </div>

          {/* MONTO (MODIFICADO: Ahora muestra U$S si corresponde) */}
          <div>
              <label className="block text-slate-400 text-sm mb-1">Monto</label>
              <div className="relative">
                  {/* Símbolo dinámico (pesos o dolares) */}
                  <span className={`absolute left-3 top-3 font-bold pointer-events-none ${isUSD ? 'text-green-500' : 'text-slate-500'}`}>
                      {currencySymbol}
                  </span>
                  <input 
                      type="number" 
                      step="0.01"
                      required 
                      className={`w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pl-12 text-white outline-none focus:border-blue-500 ${isUSD ? 'border-green-500/30' : ''}`} // pl-12 para dejar lugar al simbolo
                      placeholder="0.00" 
                      value={formData.amount} 
                      onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                  />
              </div>
              {/* Aviso extra solo si es USD */}
              {isUSD && (
                  <p className="text-[10px] text-green-400 mt-1 flex items-center gap-1 animate-in fade-in">
                      <Info size={10}/> Registrando en Dólares
                  </p>
              )}
          </div>

          <div><label className="block text-slate-400 text-sm mb-1">Descripción</label><input type="text" required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500" placeholder="Detalle..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} /></div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-slate-400 text-sm mb-1">Cuenta</label>
                <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500" value={formData.account_id} onChange={(e) => setFormData({...formData, account_id: e.target.value})}>
                    {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-slate-400 text-sm mb-1">Categoría</label>
                <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500" value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})}>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
            </div>
          </div>

          {/* BOTÓN AZUL TUYO */}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 mt-4">
              <Check size={20} /> Guardar
          </button>
        </form>
      </div>
    </div>
  )
}
export default TransactionModal