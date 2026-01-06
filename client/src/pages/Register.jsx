import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { UserPlus, Lock, Mail } from 'lucide-react'

const Register = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('http://127.0.0.1:8000/register', { email, password })
      toast.success("¡Cuenta creada! Ahora iniciá sesión.")
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al registrarse")
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Crear Cuenta ✨</h1>
            <p className="text-slate-400">Empezá a ordenar tus finanzas</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-slate-400 text-sm mb-2">Email</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 text-slate-500" size={20}/>
                    <input type="email" required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pl-10 text-white outline-none focus:border-blue-500 transition" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
            </div>
            
            <div>
                <label className="block text-slate-400 text-sm mb-2">Contraseña</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 text-slate-500" size={20}/>
                    <input type="password" required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pl-10 text-white outline-none focus:border-blue-500 transition" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 transition">
                <UserPlus size={20}/> Registrarme
            </button>
        </form>

        <p className="text-slate-500 text-center mt-6 text-sm">
            ¿Ya tenés cuenta? <Link to="/login" className="text-blue-400 hover:text-blue-300 font-bold">Iniciá sesión</Link>
        </p>
      </div>
    </div>
  )
}

export default Register