import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

const StatsCard = ({ title, amount, secAmount, icon: Icon, trend, isPositive, color }) => {
  const colors = {
    blue: "bg-blue-500/10 text-blue-500",
    green: "bg-emerald-500/10 text-emerald-500",
    red: "bg-red-500/10 text-red-500",
    purple: "bg-purple-500/10 text-purple-500"
  }
  const activeColor = colors[color] || colors.blue

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4 hover:border-slate-700 transition">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${activeColor}`}>
        {Icon && <Icon size={24} />}
      </div>
      <div className="flex-1">
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        
        {/* ARS */}
        <h3 className="text-2xl font-bold text-white">${amount?.toLocaleString('es-AR') || 0}</h3>
        
        {/* USD (Solo si hay) */}
        {secAmount > 0 && (
           <p className="text-green-400 font-bold text-sm mt-0.5 flex items-center gap-1">
              + U$S {secAmount.toLocaleString()}
           </p>
        )}

        {trend && (
          <p className={`text-xs mt-2 flex items-center gap-1 ${isPositive ? 'text-emerald-500/80' : 'text-red-500/80'}`}>
             {trend}
          </p>
        )}
      </div>
    </div>
  )
}

export default StatsCard