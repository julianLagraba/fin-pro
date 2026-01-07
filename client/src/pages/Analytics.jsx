import { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell, PieChart, Pie, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts'
import { PieChart as PieIcon, TrendingUp, CreditCard, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Analytics = () => {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [clients, setClients] = useState([])
  const [cards, setCards] = useState([])
  const [subs, setSubs] = useState([])
  const { user } = useAuth()
  
  
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  const fetchData = async () => {
    try {
      const [transRes, clientRes, cardRes, subRes] = await Promise.all([
         axios.get(`https://fin-pro-t78k.onrender.com/users/${user.id}/transactions/`),
         axios.get(`https://fin-pro-t78k.onrender.com/users/${user.id}/clients/`),
         axios.get(`https://fin-pro-t78k.onrender.com/users/${user.id}/credit-cards/`),
         axios.get(`https://fin-pro-t78k.onrender.com/users/${user.id}/subscriptions/`)
      ])
      
      const clientsWithJobs = await Promise.all(clientRes.data.map(async (c) => {
          const jobsRes = await axios.get(`https://fin-pro-t78k.onrender.com/clients/${c.id}/jobs/`)
          return { ...c, jobs: jobsRes.data }
      }))

      setTransactions(transRes.data)
      setClients(clientsWithJobs)
      setCards(cardRes.data)
      setSubs(subRes.data)
      setLoading(false)
    } catch (error) { console.error(error); setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  // --- PROCESAMIENTO ---
  const getMonthlyEvolution = () => {
    const months = {}
    transactions.forEach(t => {
        const key = t.date ? t.date.slice(0, 7) : 'Sin Fecha'
        if(!months[key]) months[key] = { name: key, ingresos: 0, gastos: 0 }
        if(t.amount > 0) months[key].ingresos += t.amount
        else months[key].gastos += Math.abs(t.amount)
    })
    return Object.values(months).sort((a,b) => a.name.localeCompare(b.name)).slice(-6)
  }

  const getTopClients = () => {
      return clients.map(c => {
          const total = c.jobs.filter(j => j.is_paid).reduce((acc, j) => acc + j.amount, 0)
          return { name: c.name, total }
      })
      .sort((a,b) => b.total - a.total)
      .slice(0, 5)
  }

  const getCostStructure = () => {
      const totalSubs = subs.reduce((acc, s) => acc + s.price, 0)
      const currentMonth = new Date().toISOString().slice(0, 7)
      const monthlyExpenses = Math.abs(transactions
        .filter(t => t.date && t.date.startsWith(currentMonth) && t.amount < 0)
        .reduce((acc, t) => acc + t.amount, 0))
      
      return [
          { name: 'Suscripciones', value: totalSubs },
          { name: 'Gastos Variables', value: monthlyExpenses - totalSubs > 0 ? monthlyExpenses - totalSubs : 0 }
      ]
  }

  // Estilo común para todos los tooltips
  const tooltipStyle = {
      contentStyle: { backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' },
      itemStyle: { color: '#e2e8f0' }, // Texto de los items claro
      labelStyle: { color: '#94a3b8' }  // Texto del titulo claro
  }

  if (loading) return <div className="p-10 text-white">Cargando datos...</div>

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-2">Centro de Estadísticas</h2>
      <p className="text-slate-400 mb-8">Análisis profundo de tus finanzas.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. AREA CHART */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl col-span-1 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><TrendingUp size={20}/></div>
                <h3 className="text-lg font-bold text-white">Flujo de Caja</h3>
            </div>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getMonthlyEvolution()}>
                        <defs>
                            <linearGradient id="colorIng" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorGas" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false}/>
                        <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#cbd5e1', fontSize: 12}} tickLine={false}/>
                        <YAxis stroke="#94a3b8" tick={{fill: '#cbd5e1', fontSize: 12}} tickLine={false} tickFormatter={(value) => `$${value/1000}k`}/>
                        
                        {/* TOOLTIP ARREGLADO */}
                        <Tooltip {...tooltipStyle} />
                        
                        <Legend wrapperStyle={{ color: '#cbd5e1' }}/>
                        <Area type="monotone" dataKey="ingresos" stroke="#10b981" fillOpacity={1} fill="url(#colorIng)" name="Ingresos" strokeWidth={3}/>
                        <Area type="monotone" dataKey="gastos" stroke="#ef4444" fillOpacity={1} fill="url(#colorGas)" name="Gastos" strokeWidth={3}/>
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* 2. BAR CHART */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><Users size={20}/></div>
                <h3 className="text-lg font-bold text-white">Ranking Clientes</h3>
            </div>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getTopClients()} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false}/>
                        <XAxis type="number" stroke="#94a3b8" hide/>
                        <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} tick={{fill: '#fff', fontSize: 12, fontWeight: '500'}} tickLine={false}/>
                        
                        {/* TOOLTIP ARREGLADO */}
                        <Tooltip cursor={{fill: 'transparent'}} {...tooltipStyle} />
                        
                        <Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20}>
                             {getTopClients().map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* 3. PIE CHART */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500"><PieIcon size={20}/></div>
                <h3 className="text-lg font-bold text-white">Estructura Gastos</h3>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={getCostStructure()} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {getCostStructure().map((entry, index) => (<Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : '#334155'} />))}
                        </Pie>
                        
                        {/* TOOLTIP ARREGLADO */}
                        <Tooltip {...tooltipStyle} />
                        
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

      </div>
    </div>
  )
}
export default Analytics