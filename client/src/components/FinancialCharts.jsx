import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1']

export const CategoryChart = ({ transactions, categories }) => {
  // 1. Agrupar gastos por categoría
  const data = categories.map(cat => {
    const total = transactions
      .filter(t => t.category_id === cat.id && t.amount < 0) // Solo gastos
      .reduce((acc, t) => acc + Math.abs(t.amount), 0)
    return { name: cat.name, value: total }
  }).filter(item => item.value > 0) // Sacar categorías sin gastos

  if (data.length === 0) return <div className="h-64 flex items-center justify-center text-slate-500">Sin datos de gastos este mes.</div>

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
      <h3 className="text-white font-bold mb-4">Gastos por Categoría</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
              ))}
            </Pie>
            <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value) => `$${value.toLocaleString()}`}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Referencias manuales abajo */}
      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {data.map((entry, index) => (
            <div key={index} className="flex items-center gap-1 text-xs text-slate-400">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                {entry.name}
            </div>
        ))}
      </div>
    </div>
  )
}

export const HistoryChart = ({ transactions }) => {
    // 1. Agrupar por mes (Últimos 6 meses)
    // Nota: Esto toma TODAS las transacciones históricas
    const processData = () => {
        const months = {}
        
        transactions.forEach(t => {
            const date = t.date || "Sin fecha"
            const monthKey = date.substring(0, 7) // "2025-01"
            
            if (!months[monthKey]) months[monthKey] = { name: monthKey, ingresos: 0, gastos: 0 }
            
            if (t.amount > 0) months[monthKey].ingresos += t.amount
            else months[monthKey].gastos += Math.abs(t.amount)
        })

        // Convertir a array y ordenar
        return Object.values(months)
            .sort((a, b) => a.name.localeCompare(b.name))
            .slice(-6) // Últimos 6 meses
    }

    const data = processData()

    return (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-white font-bold mb-4">Evolución Semestral</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 12}} />
                        <YAxis stroke="#64748b" tick={{fontSize: 12}} tickFormatter={(val) => `$${val/1000}k`} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px' }}/>
                        <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}