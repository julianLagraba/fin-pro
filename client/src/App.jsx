import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import { AuthProvider, useAuth } from './context/AuthContext'

// Páginas
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import CreditCards from './pages/CreditCards'
import Clients from './pages/Clients'
import Subscriptions from './pages/Subscriptions'
import Analytics from './pages/Analytics'
import Goals from './pages/Goals'
import Login from './pages/Login'     
import Register from './pages/Register' 

// Componente para Proteger Rutas
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rutas Privadas (Todas envueltas en Layout y ProtectedRoute) */}
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/config" element={<Settings />} />
                  <Route path="/tarjetas" element={<CreditCards />} />
                  <Route path="/clientes" element={<Clients />} />
                  <Route path="/suscripciones" element={<Subscriptions />} />
                  <Route path="/estadisticas" element={<Analytics />} />
                  <Route path="/metas" element={<Goals />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App