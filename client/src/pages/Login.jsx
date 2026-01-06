import { useState, useEffect } from 'react' // <--- 1. IMPORTAR useEffect
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { LogIn, Lock, Mail, Loader2 } from 'lucide-react'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false) // Un estadito visual de carga
  
  const { login, user } = useAuth() // <--- 2. TRAEMOS 'user' TAMBIÉN
  const navigate = useNavigate()

  // 3. LA SOLUCIÓN MÁGICA:
  // Si 'user' deja de ser null (o sea, se completó el login), nos vamos solos.
  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const formData = new FormData()
    formData.append('username', email)
    formData.append('password', password)

    try {
      const res = await axios.post('http://127.0.0.1:8000/token', formData)
      login(res.data.access_token)
      toast.success("¡Bienvenido de nuevo! 👋")
      // YA NO HACEMOS navigate() ACÁ. DEJAMOS QUE EL useEffect LO HAGA.
    } catch (error) {
      toast.error("Email o contraseña incorrectos")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Fin Pro 🚀</h1>
            <p className="text-slate-400">Tu control financiero personal</p>
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

            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><LogIn size={20}/> Iniciar Sesión</>}
            </button>
        </form>

        <p className="text-slate-500 text-center mt-6 text-sm">
            ¿No tenés cuenta? <Link to="/register" className="text-blue-400 hover:text-blue-300 font-bold">Registrate acá</Link>
        </p>
      </div>
    </div>
  )
}

export default Login