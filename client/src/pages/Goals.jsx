import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Plus, Target, Trophy, Calendar, TrendingUp, Trash2, PiggyBank, ArrowRight, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Goals = () => {
  const [goals, setGoals] = useState([])
  const [accounts, setAccounts] = useState([])
  const { user } = useAuth()
  
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDepositOpen, setIsDepositOpen] = useState(false)
  
  const [selectedGoal, setSelectedGoal] = useState(null)
  
  const [newGoal, setNewGoal] = useState({ name: '', target_amount: '', currency: 'ARS', deadline: '' })
  const [depositData, setDepositData] = useState({ account_id: '', amount: '' })
  

  const fetchData = async () => {
    try {
      const [gRes, aRes] = await Promise.all([
          axios.get(`http://127.0.0.1:8000/users/${user.id}/goals/`),
          axios.get(`http://127.0.0.1:8000/users/${user.id}/accounts/`)
      ])
      setGoals(gRes.data)
      setAccounts(aRes.data)
    } catch (error) { console.error(error) }
  }

  useEffect(() => { fetchData() }, [user])

  const handleCreateGoal = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`http://127.0.0.1:8000/users/${user.id}/goals/`, { ...newGoal, target_amount: parseFloat(newGoal.target_amount) })
      setIsCreateOpen(false); setNewGoal({ name: '', target_amount: '', currency: 'ARS', deadline: '' }); fetchData()
      toast.success("Nueva meta creada 🎯")
    } catch (error) { toast.error("Error al crear meta") }
  }

  const handleDeleteGoal = async (id) => {
      if(!confirm("¿Borrar meta? La plata acumulada NO volverá automáticamente a la cuenta.")) return
      try {
          await axios.delete(`http://127.0.0.1:8000/goals/${id}`)
          fetchData(); toast.success("Meta eliminada")
      } catch (error) { toast.error("Error") }
  }

  const openDepositModal = (goal) => {
      if (goal.current_amount >= goal.target_amount) return toast.success("¡Ya cumpliste esta meta! 🎉")
      setSelectedGoal(goal)
      setDepositData({ account_id: '', amount: '' })
      setIsDepositOpen(true)
  }

  const handleDeposit = async (e) => {
      e.preventDefault()
      try {
          await axios.post(`http://127.0.0.1:8000/goals/${selectedGoal.id}/deposit`, {
              account_id: parseInt(depositData.account_id),
              amount: parseFloat(depositData.amount)
          })
          setIsDepositOpen(false); fetchData()
          toast.success("¡Más cerca de tu objetivo! 🚀")
      } catch (error) { 
          const msg = error.response?.data?.detail || "Error al depositar"
          toast.error(msg) 
      }
  }

  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-8">
        <div><h2 className="text-2xl font-bold text-white">Metas de Ahorro</h2><p className="text-slate-400 text-sm">Visualizá tus objetivos</p></div>
        <button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition"><Plus size={18} /> Nueva Meta</button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map(goal => {
            const percentage = Math.min(100, (goal.current_amount / goal.target_amount) * 100)
            const isCompleted = percentage >= 100
            
            return (
                <div key={goal.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative group overflow-hidden">
                    <div className="absolute bottom-0 left-0 h-1 bg-slate-800 w-full">
                        <div className={`h-full transition-all duration-1000 ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${percentage}%` }}></div>
                    </div>

                    {/* HEADER SIN SUPERPOSICIÓN */}
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${isCompleted ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                            {isCompleted ? <Trophy size={24}/> : <Target size={24}/>}
                        </div>
                        <button onClick={() => handleDeleteGoal(goal.id)} className="text-slate-600 hover:text-red-500 transition p-2"><Trash2 size={18}/></button>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1">{goal.name}</h3>
                    
                    {/* FECHA MOVIDA AQUÍ PARA QUE NO MOLESTE */}
                    {goal.deadline && (
                        <div className="text-xs text-slate-500 flex items-center gap-1 mb-4">
                            <Clock size={12}/> Vence: {goal.deadline}
                        </div>
                    )}

                    <div className="flex justify-between items-end mb-2 mt-4">
                        <div className="text-slate-400 text-sm">
                            Guardado: <span className="text-white font-bold">{goal.currency === 'USD' ? 'U$S' : '$'} {goal.current_amount.toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                             <span className="text-xs text-slate-500">Meta</span>
                             <p className="text-slate-400 font-bold text-sm">{goal.currency === 'USD' ? 'U$S' : '$'} {goal.target_amount.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="w-full bg-slate-950 rounded-full h-4 mb-2 border border-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 flex items-center justify-end pr-2 ${isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-blue-600 to-cyan-400'}`} style={{ width: `${percentage}%` }}>
                        </div>
                    </div>
                    <p className="text-right text-xs text-slate-400 mb-6">{percentage.toFixed(1)}% completado</p>

                    <button onClick={() => openDepositModal(goal)} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-sm font-medium border border-slate-700 flex items-center justify-center gap-2 transition group-hover:border-blue-500/30">
                        <PiggyBank size={16}/> {isCompleted ? '¡Meta Cumplida!' : 'Agregar Dinero'}
                    </button>
                </div>
            )
        })}
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 w-full max-w-sm shadow-2xl">
                <h3 className="text-white font-bold mb-4 text-lg">Nueva Meta</h3>
                <form onSubmit={handleCreateGoal} className="space-y-3">
                    <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none" placeholder="Nombre (Ej: Auto Nuevo)" value={newGoal.name} onChange={e => setNewGoal({...newGoal, name: e.target.value})} required />
                    <div className="grid grid-cols-2 gap-3">
                         <input type="number" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none" placeholder="Monto Meta" value={newGoal.target_amount} onChange={e => setNewGoal({...newGoal, target_amount: e.target.value})} required />
                         <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none" value={newGoal.currency} onChange={e => setNewGoal({...newGoal, currency: e.target.value})}>
                            <option value="ARS">ARS 🇦🇷</option><option value="USD">USD 🇺🇸</option>
                        </select>
                    </div>
                    <div className="relative"><Calendar className="absolute left-3 top-3 text-slate-500 pointer-events-none" size={16}/><input type="date" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pl-10 text-white outline-none cursor-pointer" onClick={e=>e.target.showPicker()} value={newGoal.deadline} onChange={e => setNewGoal({...newGoal, deadline: e.target.value})} /></div>
                    <div className="flex gap-2 mt-4"><button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 bg-slate-800 text-white p-2 rounded-lg">Cancelar</button><button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded-lg">Crear</button></div>
                </form>
            </div>
        </div>
      )}

      {isDepositOpen && selectedGoal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 w-full max-w-sm shadow-2xl">
                <h3 className="text-white font-bold mb-2 text-lg flex items-center gap-2"><TrendingUp className="text-green-400"/> Ahorrar</h3>
                <p className="text-slate-400 text-sm mb-4">Vas a mover plata a <b>{selectedGoal.name}</b></p>
                <form onSubmit={handleDeposit} className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Desde Cuenta ({selectedGoal.currency})</label>
                        <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none" value={depositData.account_id} onChange={e => setDepositData({...depositData, account_id: e.target.value})} required>
                            <option value="">Seleccionar...</option>
                            {accounts.filter(a => a.currency === selectedGoal.currency).map(a => (
                                <option key={a.id} value={a.id}>{a.name} (Disp: ${a.balance})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Monto a guardar</label>
                        <input type="number" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none" placeholder="0.00" value={depositData.amount} onChange={e => setDepositData({...depositData, amount: e.target.value})} required />
                    </div>
                    
                    <div className="flex gap-2 mt-4"><button type="button" onClick={() => setIsDepositOpen(false)} className="flex-1 bg-slate-800 text-white p-2 rounded-lg">Cancelar</button><button type="submit" className="flex-1 bg-green-600 text-white p-2 rounded-lg font-bold">Confirmar</button></div>
                </form>
            </div>
        </div>
      )}
    </div>
  )
}
export default Goals