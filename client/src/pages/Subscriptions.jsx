import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast' // <--- IMPORTAR
import { Plus, CreditCard, Calendar, Trash2, Zap, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Subscriptions = () => {
  const [subs, setSubs] = useState([])
  const [cards, setCards] = useState([])
  const { user } = useAuth()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newSub, setNewSub] = useState({ 
    name: '', price: '', currency: 'ARS', billing_day: '', card_id: '' 
  })
  

  const fetchData = async () => {
    try {
      const [subRes, cardRes] = await Promise.all([
        axios.get(`http://127.0.0.1:8000/users/${user.id}/subscriptions/`),
        axios.get(`http://127.0.0.1:8000/users/${user.id}/credit-cards/`)
      ])
      setSubs(subRes.data)
      setCards(cardRes.data)
    } catch (error) { console.error(error) }
  }

  useEffect(() => { fetchData() }, [user])

  const handleCreateSub = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`http://127.0.0.1:8000/users/${user.id}/subscriptions/`, {
        ...newSub,
        price: parseFloat(newSub.price),
        billing_day: parseInt(newSub.billing_day),
        card_id: newSub.card_id ? parseInt(newSub.card_id) : null
      })
      setIsModalOpen(false)
      setNewSub({ name: '', price: '', currency: 'ARS', billing_day: '', card_id: '' })
      fetchData()
      toast.success("Suscripción creada y agregada a tu tarjeta automáticamente 🚀") // <--- TOAST
    } catch (error) { toast.error("Error al crear suscripción") }
  }

  const handleDeleteSub = async (id) => {
    if(!confirm("¿Borrar suscripción? Nota: El gasto en la tarjeta deberás borrarlo manualmente.")) return
    try {
        await axios.delete(`http://127.0.0.1:8000/subscriptions/${id}`) // Necesitarías endpoint de borrar
        fetchData()
        toast.success("Suscripción borrada") // <--- TOAST
    } catch (error) { toast.error("Función borrar no implementada en backend aún") }
  }

  const totalARS = subs.filter(s => s.currency === 'ARS').reduce((acc, s) => acc + s.price, 0)
  const totalUSD = subs.filter(s => s.currency === 'USD').reduce((acc, s) => acc + s.price, 0)

  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-8">
        <div><h2 className="text-2xl font-bold text-white">Suscripciones</h2><p className="text-slate-400 text-sm">Tus gastos fijos recurrentes</p></div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition"><Plus size={18} /> Nueva Suscripción</button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
         <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between"><span className="text-slate-400">Total Fijo en Pesos</span><span className="text-2xl font-bold text-white">${totalARS.toLocaleString()}</span></div>
         <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between"><span className="text-slate-400">Total Fijo en Dólares</span><span className="text-2xl font-bold text-green-400">U$S {totalUSD.toLocaleString()}</span></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subs.map(sub => {
            const cardName = cards.find(c => c.id === sub.card_id)?.name || 'Sin tarjeta'
            return (
                <div key={sub.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative group hover:border-blue-500/50 transition">
                    <div className="flex justify-between items-start mb-4"><div className="p-3 bg-purple-500/10 rounded-xl text-purple-400"><Zap size={24}/></div><button onClick={() => handleDeleteSub(sub.id)} className="text-slate-600 hover:text-red-500 transition"><Trash2 size={18}/></button></div>
                    <h3 className="text-lg font-bold text-white mb-1">{sub.name}</h3>
                    <div className="text-2xl font-bold text-white mb-4">{sub.currency === 'USD' ? <span className="text-green-400">U$S </span> : <span>$ </span>}{sub.price.toLocaleString()}</div>
                    <div className="space-y-2 text-sm text-slate-400 border-t border-slate-800 pt-4">
                        <div className="flex justify-between"><span className="flex items-center gap-2"><Calendar size={14}/> Día de cobro:</span><span className="text-white font-medium">{sub.billing_day}</span></div>
                        <div className="flex justify-between"><span className="flex items-center gap-2"><CreditCard size={14}/> Debitado de:</span><span className="text-blue-400 font-medium">{cardName}</span></div>
                    </div>
                </div>
            )
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">
                <h3 className="text-white font-bold mb-4 text-lg">Nueva Suscripción</h3>
                <form onSubmit={handleCreateSub} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2"><label className="block text-slate-400 text-xs mb-1">Servicio (Ej: Netflix)</label><input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none" value={newSub.name} onChange={e => setNewSub({...newSub, name: e.target.value})} required /></div>
                        <div><label className="block text-slate-400 text-xs mb-1">Precio</label><input type="number" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none" value={newSub.price} onChange={e => setNewSub({...newSub, price: e.target.value})} required /></div>
                        <div><label className="block text-slate-400 text-xs mb-1">Moneda</label><select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none" value={newSub.currency} onChange={e => setNewSub({...newSub, currency: e.target.value})}><option value="ARS">ARS 🇦🇷</option><option value="USD">USD 🇺🇸</option></select></div>
                    </div>
                    <div><label className="block text-slate-400 text-xs mb-1">Día del mes que te cobran (1-31)</label><input type="number" max="31" min="1" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none" value={newSub.billing_day} onChange={e => setNewSub({...newSub, billing_day: e.target.value})} required /></div>
                    <div><label className="block text-slate-400 text-xs mb-1">Debitar automáticamente de tarjeta:</label><select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none" value={newSub.card_id} onChange={e => setNewSub({...newSub, card_id: e.target.value})} required><option value="">Seleccionar Tarjeta...</option>{cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1"><CheckCircle size={10}/> Se agregará al resumen de la tarjeta como gasto recurrente.</p></div>
                    <div className="flex gap-2 mt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 text-white p-2 rounded-lg">Cancelar</button><button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded-lg font-bold">Crear Suscripción</button></div>
                </form>
            </div>
        </div>
      )}
    </div>
  )
}
export default Subscriptions