import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast' // <--- IMPORTAR
import { Plus, Users, Briefcase, Phone, Mail, X, CheckCircle, Clock, DollarSign, Loader2, Calendar } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Clients = () => {
  const [clients, setClients] = useState([])
  const [accounts, setAccounts] = useState([])
  const { user } = useAuth()
  
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [isJobFormOpen, setIsJobFormOpen] = useState(false)
  
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)
  const [jobToPay, setJobToPay] = useState(null)
  const [payAccountId, setPayAccountId] = useState('')
  const [exchangeRate, setExchangeRate] = useState('1')
  const [isPaying, setIsPaying] = useState(false)

  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '' })
  const [newJob, setNewJob] = useState({ description: '', amount: '', date: new Date().toISOString().split('T')[0], currency: 'ARS' })
  
  const [clientJobs, setClientJobs] = useState([])

  const fetchData = async () => {
    try {
      const resClients = await axios.get(`https://fin-pro-t78k.onrender.com/users/${user.id}/clients/`)
      setClients(resClients.data)
      const resAccounts = await axios.get(`https://fin-pro-t78k.onrender.com/users/${user.id}/accounts/`)
      setAccounts(resAccounts.data)
    } catch (error) { console.error(error) }
  }

  useEffect(() => { fetchData() }, [user])

  const targetAccount = accounts.find(a => a.id === parseInt(payAccountId))
  const needsConversion = jobToPay?.currency === 'USD' && targetAccount?.currency === 'ARS'
  const isDirectUSD = jobToPay?.currency === 'USD' && targetAccount?.currency === 'USD'

  useEffect(() => {
    if (isDirectUSD) { setExchangeRate('1') } 
    else if (needsConversion) { setExchangeRate('') }
  }, [payAccountId, jobToPay, isDirectUSD, needsConversion])


  const handleCreateClient = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`https://fin-pro-t78k.onrender.com/users/${user.id}/clients/`, newClient)
      setIsCreateOpen(false); setNewClient({ name: '', email: '', phone: '' }); fetchData()
      toast.success("Cliente creado") // <--- TOAST
    } catch (error) { toast.error("Error al crear cliente") }
  }

  const openClientDetail = async (client) => {
    setSelectedClient(client)
    try {
      const res = await axios.get(`https://fin-pro-t78k.onrender.com/clients/${client.id}/jobs/`)
      setClientJobs(res.data)
    } catch (error) { console.error(error) }
  }

  const handleCreateJob = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`https://fin-pro-t78k.onrender.com/clients/${selectedClient.id}/jobs/`, { ...newJob, amount: parseFloat(newJob.amount) })
      setIsJobFormOpen(false)
      setNewJob({ description: '', amount: '', date: new Date().toISOString().split('T')[0], currency: 'ARS' })
      openClientDetail(selectedClient) 
      toast.success("Trabajo agregado") // <--- TOAST
    } catch (error) { toast.error("Error al cargar trabajo") }
  }

  const openPayModal = (job) => {
    setJobToPay(job)
    setPayAccountId(accounts.length > 0 ? accounts[0].id : '')
    setExchangeRate('1')
    setIsPayModalOpen(true)
  }

  const handleConfirmPay = async (e) => {
    e.preventDefault()
    setIsPaying(true)
    try {
      await axios.post(`https://fin-pro-t78k.onrender.com/jobs/${jobToPay.id}/pay`, { 
        account_id: parseInt(payAccountId),
        exchange_rate: parseFloat(exchangeRate || 1)
      })
      setIsPaying(false); setIsPayModalOpen(false); setJobToPay(null); openClientDetail(selectedClient); 
      toast.success("¡Cobro registrado exitosamente!", { icon: '💰' }) // <--- TOAST CON ICONO
    } catch (error) { setIsPaying(false); toast.error("Error al procesar cobro") }
  }

  const pendingAmount = clientJobs.filter(j => !j.is_paid).reduce((acc, j) => acc + j.amount, 0)
  
  let totalToReceive = 0
  if (jobToPay) {
      if (needsConversion && exchangeRate) { totalToReceive = jobToPay.amount * parseFloat(exchangeRate) } 
      else { totalToReceive = jobToPay.amount }
  }

  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-8">
        <div><h2 className="text-2xl font-bold text-white">Mis Clientes</h2><p className="text-slate-400 text-sm">Gestioná tus proyectos</p></div>
        <button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition"><Plus size={18} /> Nuevo Cliente</button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map(client => (
          <div key={client.id} onClick={() => openClientDetail(client)} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 cursor-pointer transition group">
            <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition"><Users size={24} /></div>
                <div><h3 className="text-lg font-bold text-white">{client.name}</h3><p className="text-slate-500 text-xs">Click para ver trabajos</p></div>
            </div>
          </div>
        ))}
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 w-full max-w-sm shadow-2xl">
                <h3 className="text-white font-bold mb-4 text-lg">Nuevo Cliente</h3>
                <form onSubmit={handleCreateClient} className="space-y-3">
                    <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none" placeholder="Nombre" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} required />
                    <div className="flex gap-2 mt-4"><button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 bg-slate-800 text-white p-2 rounded-lg">Cancelar</button><button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded-lg">Guardar</button></div>
                </form>
            </div>
        </div>
      )}

      {selectedClient && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="bg-slate-800 p-5 flex justify-between items-start border-b border-slate-700">
                    <div><h3 className="text-white font-bold text-xl flex items-center gap-2"><Briefcase size={20} className="text-blue-400"/> {selectedClient.name}</h3>
                    <p className="text-slate-400 text-sm mt-1">Saldo Pendiente: <span className="text-red-400 font-bold">${pendingAmount.toLocaleString('es-AR')}</span></p></div>
                    <button onClick={() => setSelectedClient(null)} className="text-slate-400 hover:text-white bg-slate-700/50 p-2 rounded-full"><X size={20}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50">
                    {!isJobFormOpen ? (
                        <button onClick={() => setIsJobFormOpen(true)} className="w-full border-2 border-dashed border-slate-700 rounded-xl p-4 text-slate-500 hover:border-blue-500 hover:text-blue-500 transition mb-6 flex justify-center items-center gap-2 font-medium"><Plus size={20} /> Agregar Nuevo Proyecto / Trabajo</button>
                    ) : (
                        <form onSubmit={handleCreateJob} className="bg-slate-900 border border-slate-700 p-4 rounded-xl mb-6">
                            <h4 className="text-white font-medium mb-3 text-sm">Nuevo Trabajo</h4>
                            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 mb-3 w-fit">
                                <button type="button" onClick={() => setNewJob({...newJob, currency: 'ARS'})} className={`px-4 py-1.5 rounded-md text-xs font-medium transition ${newJob.currency === 'ARS' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500'}`}>Pesos (ARS)</button>
                                <button type="button" onClick={() => setNewJob({...newJob, currency: 'USD'})} className={`px-4 py-1.5 rounded-md text-xs font-medium transition ${newJob.currency === 'USD' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500'}`}>Dólares (USD)</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input className="md:col-span-2 bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-sm outline-none" placeholder="Descripción" value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})} required />
                                <div className="relative"><span className="absolute left-3 top-2 text-slate-500 text-xs">{newJob.currency === 'USD' ? 'U$S' : '$'}</span><input type="number" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 pl-10 text-white text-sm outline-none" placeholder="Monto" value={newJob.amount} onChange={e => setNewJob({...newJob, amount: e.target.value})} required /></div>
                                <div className="relative"><Calendar className="absolute left-3 top-2 text-slate-500 pointer-events-none" size={16} /><input type="date" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 pl-10 text-white text-sm outline-none cursor-pointer" value={newJob.date} onChange={e => setNewJob({...newJob, date: e.target.value})} onClick={(e) => e.target.showPicker()} required /></div>
                            </div>
                            <div className="flex justify-end gap-2 mt-3"><button type="button" onClick={() => setIsJobFormOpen(false)} className="text-slate-400 text-xs hover:text-white px-3 py-2">Cancelar</button><button type="submit" className="bg-blue-600 text-white text-xs px-4 py-2 rounded-lg font-bold">Guardar</button></div>
                        </form>
                    )}

                    <div className="space-y-3">
                        {clientJobs.map(job => (
                            <div key={job.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4"><div className={`p-3 rounded-full ${job.is_paid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{job.is_paid ? <CheckCircle size={20}/> : <Clock size={20}/>}</div><div><h4 className="text-white font-bold">{job.description}</h4><p className="text-slate-500 text-xs">{job.date}</p></div></div>
                                <div className="flex items-center gap-4 justify-between md:justify-end w-full md:w-auto">
                                    <span className={`text-xl font-bold ${job.currency === 'USD' ? 'text-blue-400' : 'text-white'}`}>{job.currency === 'USD' ? 'U$S ' : '$ '}{job.amount.toLocaleString()}</span>
                                    {!job.is_paid ? (<button onClick={() => openPayModal(job)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"><DollarSign size={16} /> Cobrar</button>) : <span className="text-emerald-500 text-sm font-medium border border-emerald-500/30 px-3 py-1 rounded bg-emerald-500/10">Cobrado</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

      {isPayModalOpen && jobToPay && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 w-full max-w-sm shadow-2xl">
                <h3 className="text-white font-bold mb-4 text-lg flex items-center gap-2"><DollarSign className="text-emerald-400"/> Registrar Cobro</h3>
                <form onSubmit={handleConfirmPay} className="space-y-4">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <p className="text-slate-400 text-xs">Vas a cobrar:</p>
                        <p className="text-white font-bold text-lg">{jobToPay.currency === 'USD' ? 'U$S' : '$'} {jobToPay.amount.toLocaleString()}</p>
                    </div>

                    <div>
                        <label className="block text-slate-400 text-sm mb-2">Destino del dinero</label>
                        <select value={payAccountId} onChange={e => setPayAccountId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none" required>
                            {accounts.map(acc => (<option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>))}
                        </select>
                    </div>

                    {needsConversion ? (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="block text-slate-400 text-sm mb-2">Cotización (A Pesos)</label>
                            <input type="number" value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500" placeholder="Ej: 1200" required />
                        </div>
                    ) : isDirectUSD ? (
                        <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 text-blue-300 text-xs">
                           <CheckCircle size={12} className="inline mr-1"/> Se guardarán <b>U$S {jobToPay.amount}</b>.
                        </div>
                    ) : null}

                    <div className="flex justify-between items-center border-t border-slate-800 pt-3">
                        <span className="text-slate-400 text-sm">Se acreditarán:</span>
                        <span className={`font-bold text-xl ${targetAccount?.currency === 'USD' ? 'text-green-400' : 'text-emerald-400'}`}>
                            {targetAccount?.currency === 'USD' ? 'U$S ' : '$ '}
                            {totalToReceive.toLocaleString()}
                        </span>
                    </div>

                    <div className="flex gap-2 mt-4"><button type="button" onClick={() => setIsPayModalOpen(false)} className="flex-1 bg-slate-800 text-white p-2 rounded-lg">Cancelar</button><button type="submit" className="flex-1 bg-emerald-600 text-white p-2 rounded-lg font-bold flex justify-center items-center gap-2">{isPaying ? <Loader2 className="animate-spin" size={18}/> : "Confirmar"}</button></div>
                </form>
            </div>
        </div>
      )}
    </div>
  )
}
export default Clients