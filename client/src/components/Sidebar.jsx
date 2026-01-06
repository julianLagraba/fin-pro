import { Link, useLocation, useNavigate } from 'react-router-dom' // <--- Agregar useNavigate
import { LayoutDashboard, CreditCard, Users, Settings, LogOut, Repeat, PieChart, Target, Rocket } from 'lucide-react'
import { useAuth } from '../context/AuthContext' // <--- Importar Auth

const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate() // <--- Hook para navegar
  const { logout } = useAuth()   // <--- Función logout

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Repeat, label: "Suscripciones", path: "/suscripciones" },
    { icon: Users, label: "Clientes", path: "/clientes" },
    { icon: CreditCard, label: "Tarjetas", path: "/tarjetas" },
    { icon: PieChart, label: "Estadísticas", path: "/estadisticas" },
    { icon: Target, label: "Metas", path: "/metas" },
    { icon: Settings, label: "Configuración", path: "/config" },
  ]

  const handleLogout = () => {
      logout()
      navigate('/login')
  }

  return (
    <div className="h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed left-0 top-0 z-20">
      <div className="p-6 flex items-center gap-2">
        <Rocket className="text-blue-500" size={24} />
        <h1 className="text-2xl font-bold text-white tracking-tight">Fin Pro <span className="text-xs align-top"></span></h1>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={20} className={isActive ? "text-white" : "text-slate-500 group-hover:text-white"} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* BOTÓN LOGOUT FUNCIONAL */}
      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 w-full"
        >
          <LogOut size={20} />
          <span className="font-medium text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar