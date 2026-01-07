import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast' // <--- IMPORTAR
import { Plus, CreditCard, Tag, Wallet, DollarSign, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Settings = () => {
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const { user } = useAuth()
  
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountCurrency, setNewAccountCurrency] = useState('ARS')
  const [newCategoryName, setNewCategoryName] = useState('')

  const fetchData = async () => {
    try {
      const accRes = await axios.get(`https://fin-pro-t78k.onrender.com/users/${user.id}/accounts/`)
      setAccounts(accRes.data)
      const catRes = await axios.get(`https://fin-pro-t78k.onrender.com/users/${user.id}/categories/`)
      setCategories(catRes.data)
    } catch (error) { console.error(error) }
  }

  useEffect(() => { fetchData() }, [user])

  const handleAddAccount = async (e) => {
    e.preventDefault()
    if (!newAccountName) return
    try {
      await axios.post(`https://fin-pro-t78k.onrender.com/users/${user.id}/accounts/`, {
        name: newAccountName, balance: 0, currency: newAccountCurrency
      })
      setNewAccountName(''); setNewAccountCurrency('ARS'); fetchData()
      toast.success("¡Cuenta creada exitosamente!") // <--- TOAST
    } catch (error) { toast.error("Error al crear cuenta") } // <--- TOAST
  }

  const handleDeleteAccount = async (id) => {
    if(!confirm("¿Seguro querés eliminar esta cuenta? Se borrarán sus movimientos asociados.")) return
    try {
        await axios.delete(`https://fin-pro-t78k.onrender.com/accounts/${id}`)
        fetchData()
        toast.success("Cuenta eliminada") // <--- TOAST
    } catch (error) { toast.error("Error al eliminar cuenta") }
  }

  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!newCategoryName) return
    try {
      await axios.post(`https://fin-pro-t78k.onrender.com/categories/`, { name: newCategoryName })
      setNewCategoryName(''); fetchData()
      toast.success("Categoría agregada") // <--- TOAST
    } catch (error) { toast.error("Error al crear categoría") }
  }

  const handleDeleteCategory = async (id) => {
    if(!confirm("¿Eliminar categoría?")) return
    try {
        await axios.delete(`https://fin-pro-t78k.onrender.com/categories/${id}`)
        fetchData()
        toast.success("Categoría eliminada") // <--- TOAST
    } catch (error) { toast.error("Error al eliminar categoría") }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-8">Configuración</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* PANEL CUENTAS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><CreditCard size={24} /></div>
            <h3 className="text-xl font-bold text-white">Mis Cuentas</h3>
          </div>
          <form onSubmit={handleAddAccount} className="flex flex-col gap-3 mb-6">
            <div className="flex gap-2">
                <input type="text" placeholder="Nombre (Ej: Caja Ahorro)" className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none" value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} required/>
                <select value={newAccountCurrency} onChange={(e) => setNewAccountCurrency(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none">
                    <option value="ARS">ARS 🇦🇷</option>
                    <option value="USD">USD 🇺🇸</option>
                </select>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg transition font-medium flex justify-center items-center gap-2"><Plus size={20} /> Crear Cuenta</button>
          </form>
          <div className="space-y-3">
            {accounts.map(acc => (
              <div key={acc.id} className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800 group">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${acc.currency === 'USD' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}>
                        {acc.currency === 'USD' ? <DollarSign size={14}/> : <Wallet size={14}/>}
                    </div>
                    <span className="text-slate-300">{acc.name}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className={`text-sm font-bold ${acc.currency === 'USD' ? 'text-green-400' : 'text-blue-400'}`}>
                        {acc.currency === 'USD' ? 'U$S ' : '$ '} {acc.balance.toLocaleString()}
                    </span>
                    <button onClick={() => handleDeleteAccount(acc.id)} className="text-slate-600 hover:text-red-500 transition opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PANEL CATEGORÍAS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><Tag size={24} /></div>
            <h3 className="text-xl font-bold text-white">Categorías</h3>
          </div>
          <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
            <input type="text" placeholder="Ej: Supermercado" className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-lg transition"><Plus size={24} /></button>
          </form>
          <div className="space-y-2">
              {categories.map(cat => (
                  <div key={cat.id} className="p-2 bg-slate-950 rounded border border-slate-800 text-slate-400 text-sm pl-4 flex justify-between items-center group">
                      {cat.name}
                      <button onClick={() => handleDeleteCategory(cat.id)} className="text-slate-600 hover:text-red-500 transition opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                  </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
export default Settings