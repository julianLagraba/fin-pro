import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Wallet, TrendingUp, TrendingDown, Plus, CreditCard, ChevronLeft, ChevronRight, Calendar, Loader2 } from 'lucide-react'
import StatsCard from '../components/StatsCard'
import TransactionModal from '../components/TransactionModal'
import TransactionList from '../components/TransactionList'
import { CategoryChart, HistoryChart } from '../components/FinancialCharts'
import { useAuth } from '../context/AuthContext' // <--- 1. IMPORTANTE

const Dashboard = () => {
  const { user } = useAuth() // <--- 2. USAMOS EL USUARIO REAL

  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date()) 

  const fetchData = async () => {
    if (!user) return // Si no hay usuario, esperamos
    
    try {
      // <--- 3. USAMOS user.id EN LAS PETICIONES
      const [accRes, catRes, transRes] = await Promise.all([
         axios.get(`http://127.0.0.1:8000/users/${user.id}/accounts/`),
         axios.get(`http://127.0.0.1:8000/users/${user.id}/categories/`),
         axios.get(`http://127.0.0.1:8000/users/${user.id}/transactions/`)
      ])
      setAccounts(accRes.data)
      setCategories(catRes.data)
      setTransactions(transRes.data)
    } catch (error) { 
      console.error(error)
      toast.error("Error cargando datos")
    } finally {
      setLoading(false)
    }
  }

  // <--- 4. VIGILAMOS AL USUARIO (Array de dependencias)
  useEffect(() => { 
    fetchData() 
  }, [user])

  const handleCreateTransaction = async (data) => {
    try {
      // <--- 5. USAMOS user.id AL GUARDAR
      await axios.post(`http://127.0.0.1:8000/users/${user.id}/transactions/`, { ...data })
      setIsModalOpen(false)
      fetchData() // Recargar datos
      toast.success("Movimiento registrado")
    } catch (error) { toast.error("Error al guardar movimiento") }
  }

  const changeMonth = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  const monthName = currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
  const filterKey = currentDate.toISOString().slice(0, 7) 

  // Lógica de filtrado y cálculos (igual que antes)
  const enrichedTransactions = transactions.map(t => {
      const account = accounts.find(a => a.id === t.account_id)
      return { ...t, currency: account ? account.currency : 'ARS' } 
  })

  const monthlyTransactions = enrichedTransactions.filter(t => t.date && t.date.startsWith(filterKey))

  const totalBalanceARS = accounts.filter(a => a.currency === 'ARS').reduce((acc, item) => acc + item.balance, 0)
  const totalBalanceUSD = accounts.filter(a => a.currency === 'USD').reduce((acc, item) => acc + item.balance, 0)

  const incomeARS = monthlyTransactions.filter(t => t.amount > 0 && t.currency === 'ARS').reduce((acc, t) => acc + t.amount, 0)
  const incomeUSD = monthlyTransactions.filter(t => t.amount > 0 && t.currency === 'USD').reduce((acc, t) => acc + t.amount, 0)
  const expenseARS = Math.abs(monthlyTransactions.filter(t => t.amount < 0 && t.currency === 'ARS').reduce((acc, t) => acc + t.amount, 0))
  const expenseUSD = Math.abs(monthlyTransactions.filter(t => t.amount < 0 && t.currency === 'USD').reduce((acc, t) => acc + t.amount, 0))

  return (
    <>
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-white">Resumen General</h2>
            <p className="text-slate-400 text-sm mt-1">
                {user ? `Hola de nuevo, ${user.email.split('@')[0]} 👋` : 'Cargando...'}
            </p>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-1">
                <button onClick={() => changeMonth(-1)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition"><ChevronLeft size={20}/></button>
                <div className="px-4 py-1 flex items-center gap-2 min-w-[140px] justify-center"><Calendar size={16} className="text-blue-500 mb-0.5"/><span className="text-white font-bold capitalize">{monthName}</span></div>
                <button onClick={() => changeMonth(1)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition"><ChevronRight size={20}/></button>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"><Plus size={18} /> Nuevo</button>
        </div>
      </header>

      {/* TARJETAS SUPERIORES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard title="Patrimonio Neto" amount={totalBalanceARS} secAmount={totalBalanceUSD} icon={Wallet} trend="Total Global" isPositive={true} color="blue"/>
        <StatsCard title="Ingresos" amount={incomeARS} secAmount={incomeUSD} icon={TrendingUp} trend={`en ${monthName}`} isPositive={true} color="green"/>
        <StatsCard title="Gastos" amount={expenseARS} secAmount={expenseUSD} icon={TrendingDown} trend={`en ${monthName}`} isPositive={false} color="red"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMNA IZQUIERDA */}
        <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><CreditCard className="text-slate-400" size={20}/> Mis Cuentas</h3>
              <div className="space-y-3">
                {accounts.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-4">No tenés cuentas creadas.</p>
                ) : (
                    accounts.map((account) => (
                    <div key={account.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center hover:border-blue-500/30 transition">
                        <div>
                        <p className="text-slate-400 text-xs font-medium">{account.name}</p>
                        <p className={`text-lg font-bold ${account.balance < 0 ? 'text-red-400' : account.currency === 'USD' ? 'text-green-400' : 'text-white'}`}>
                            {account.currency === 'USD' ? 'U$S' : '$'} {account.balance.toLocaleString('es-AR')}
                        </p>
                        </div>
                        <div className={`text-[10px] px-2 py-0.5 rounded border font-bold ${account.currency === 'USD' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                            {account.currency || '???'} 
                        </div>
                    </div>
                    ))
                )}
              </div>
            </div>
            <CategoryChart transactions={monthlyTransactions} categories={categories} />
        </div>

        {/* COLUMNA DERECHA */}
        <div className="lg:col-span-2 space-y-6">
            <HistoryChart transactions={enrichedTransactions} />
            <TransactionList transactions={monthlyTransactions} />
        </div>
      </div>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateTransaction} 
        accounts={accounts} 
        categories={categories} 
      />
    </>
  )
}
export default Dashboard