import Sidebar from './Sidebar'

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* 1. Ponemos el Sidebar */}
      <Sidebar />
      
      {/* 2. Definimos el área del contenido principal 
          ml-64 empuja el contenido para que no quede tapado por el sidebar */}
      <main className="ml-64 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout