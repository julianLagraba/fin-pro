import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast' // <--- IMPORTAR
import { Plus, CreditCard, ShoppingCart, X, Trash2, CheckCircle, Loader2, Wallet, DollarSign, Calendar, FileText, Clock, ChevronLeft, ChevronRight, Repeat } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const CreditCards = () => {
  const [cards, setCards] = useState([])
  const [accounts, setAccounts] = useState([])
  const { user } = useAuth()
  
  const [currentDate, setCurrentDate] = useState(new Date()) 
  
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  
  const [selectedCard, setSelectedCard] = useState(null)
  const [selectedCardPurchases, setSelectedCardPurchases] = useState([]) 
  
  const [newCardData, setNewCardData] = useState({ name: '', limit: '', closing_day: '' })
  
  const [expenseData, setExpenseData] = useState({ description: '', amount: '', installments: 1, currency: 'ARS', date: new Date().toISOString().split('T')[0], is_recurring: false })
  const [payAccountId, setPayAccountId] = useState('')
  const [exchangeRate, setExchangeRate] = useState('')
  const [isPaying, setIsPaying] = useState(false) 
  

  const fetchData = async () => {
    try {
      const cardRes = await axios.get(`https://fin-pro-t78k.onrender.com/users/${user.id}/credit-cards/`)
      setCards(cardRes.data)
      const accRes = await axios.get(`https://fin-pro-t78k.onrender.com/users/${user.id}/accounts/`)
      setAccounts(accRes.data)
    } catch (error) { console.error(error) }
  }

  useEffect(() => { fetchData() }, [user])

  // --- ESTILOS DINÁMICOS DE TARJETA ---
  const getCardStyle = (name) => {
      const n = name.toLowerCase()
      if (n.includes('visa')) return 'bg-gradient-to-br from-blue-900 to-blue-600 border-blue-500/50'
      if (n.includes('master')) return 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-600/50'
      if (n.includes('amex') || n.includes('american')) return 'bg-gradient-to-br from-cyan-700 to-blue-800 border-cyan-500/50'
      return 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700'
  }

  const getCardLogoText = (name) => {
      const n = name.toLowerCase()
      if (n.includes('visa')) return 'VISA'
      if (n.includes('master')) return 'Mastercard'
      if (n.includes('amex')) return 'AMERICAN EXPRESS'
      return ''
  }

  const changeMonth = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + direction)
    setCurrentDate(newDate)
  }
  const monthName = currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })

  const calculateDisplayStatus = (purchase) => {
    const purchaseDate = new Date(purchase.date)
    const viewDate = new Date(currentDate)
    const pMonth = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), 1)
    const vMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)

    if (pMonth > vMonth) return { show: false }
    if (purchase.is_recurring) return { show: true, label: 'Débito Automático', active: true }

    const monthsDiff = (vMonth.getFullYear() - pMonth.getFullYear()) * 12 + (vMonth.getMonth() - pMonth.getMonth())
    const currentInstallment = monthsDiff + 1

    if (currentInstallment > purchase.installments) return { show: false }
    return { show: true, label: `${currentInstallment} / ${purchase.installments}`, active: false }
  }

  const visiblePurchases = selectedCardPurchases.map(p => {
    const status = calculateDisplayStatus(p)
    return { ...p, ...status }
  }).filter(p => p.show)

  const handleCreateCard = async (e) => {
    e.preventDefault()
    try {
        await axios.post(`https://fin-pro-t78k.onrender.com/users/${user.id}/credit-cards/`, {
            name: newCardData.name, limit: parseFloat(newCardData.limit), closing_day: parseInt(newCardData.closing_day)
        })
        setIsCreateOpen(false); fetchData()
        toast.success("Tarjeta agregada a tu billetera") // <--- TOAST
    } catch (error) { toast.error("Error al crear tarjeta") }
  }

  const openExpenseModal = (card) => {
    setSelectedCard(card)
    setExpenseData({ description: '', amount: '', installments: 1, currency: 'ARS', date: new Date().toISOString().split('T')[0], is_recurring: false })
    setIsExpenseModalOpen(true)
  }

  const submitExpense = async (e) => {
    e.preventDefault()
    try {
        await axios.post(`https://fin-pro-t78k.onrender.com/credit-cards/${selectedCard.id}/purchases/`, {
            ...expenseData,
            amount: parseFloat(expenseData.amount),
            installments: expenseData.is_recurring ? 1 : parseInt(expenseData.installments)
        })
        setIsExpenseModalOpen(false)
        toast.success("Compra registrada en la tarjeta") // <--- TOAST
    } catch (error) { toast.error("Error al guardar compra") }
  }

  const handleViewSummary = async (card) => {
    setSelectedCard(card)
    try {
        const res = await axios.get(`https://fin-pro-t78k.onrender.com/credit-cards/${card.id}/purchases/`)
        setSelectedCardPurchases(res.data)
        setIsSummaryOpen(true)
    } catch (error) { toast.error("Error al cargar resumen") }
  }

  const handleDeletePurchase = async (purchaseId) => {
    if(!confirm("¿Borrar esta compra?")) return
    try {
        await axios.delete(`https://fin-pro-t78k.onrender.com/card-purchases/${purchaseId}`)
        const res = await axios.get(`https://fin-pro-t78k.onrender.com/credit-cards/${selectedCard.id}/purchases/`)
        setSelectedCardPurchases(res.data)
        toast.success("Compra eliminada") // <--- TOAST
    } catch (error) { toast.error("Error al eliminar") }
  }

  const totalARS = visiblePurchases.filter(p => p.currency === 'ARS').reduce((acc, item) => acc + item.amount, 0)
  const totalUSD = visiblePurchases.filter(p => p.currency === 'USD').reduce((acc, item) => acc + item.amount, 0)
  const estimatedTotal = totalARS + (totalUSD > 0 && exchangeRate ? totalUSD * parseFloat(exchangeRate) : 0)

  const openPayModal = () => {
    if (totalARS === 0 && totalUSD === 0) return toast("No hay nada que pagar este mes", { icon: '🤷‍♂️' }) // <--- TOAST CON ICONO
    setPayAccountId(accounts.length > 0 ? accounts[0].id : ''); setExchangeRate(''); setIsPayModalOpen(true)
  }

  const confirmPayment = async (e) => {
    e.preventDefault()
    setIsPaying(true)
    let finalAmount = totalARS
    let description = `Pago Tarjeta (${monthName})`
    if (totalUSD > 0) { finalAmount += (totalUSD * parseFloat(exchangeRate)); description += ` (+ U$S ${totalUSD})` }
    try {
        await axios.post(`https://fin-pro-t78k.onrender.com/users/${user.id}/transactions/`, {
            amount: -Math.abs(finalAmount), description: description, account_id: parseInt(payAccountId), category_id: 1, date: new Date().toISOString().split('T')[0]
        })
        setIsPaying(false); setIsPayModalOpen(false); setIsSummaryOpen(false); fetchData()
        toast.success(`Pago de tarjeta registrado: $${finalAmount.toLocaleString()}`) // <--- TOAST
    } catch (error) { setIsPaying(false); toast.error("Hubo un error al procesar el pago") }
  }

  return (
    <div className="p-6">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div><h2 className="text-2xl font-bold text-white">Mis Tarjetas</h2><p className="text-slate-400 text-sm">Administrá tus vencimientos</p></div>
        <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-1">
            <button onClick={() => changeMonth(-1)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition"><ChevronLeft size={20}/></button>
            <div className="px-4 py-1 flex items-center gap-2 min-w-[140px] justify-center"><Calendar size={16} className="text-blue-500 mb-0.5"/><span className="text-white font-bold capitalize">{monthName}</span></div>
            <button onClick={() => changeMonth(1)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition"><ChevronRight size={20}/></button>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18} /> Nueva Tarjeta</button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => (
          <div key={card.id} className={`relative overflow-hidden rounded-2xl border p-6 h-56 flex flex-col justify-between group transition shadow-xl ${getCardStyle(card.name)}`}>
            <div className="absolute bottom-[-10px] right-[-10px] text-6xl font-black text-white opacity-5 italic pointer-events-none">{getCardLogoText(card.name) || 'CARD'}</div>
            <div className="absolute top-6 right-6 flex gap-2"><div className="w-8 h-6 bg-yellow-200/20 rounded-md border border-yellow-200/40 backdrop-blur-sm"></div><div className="text-white font-bold tracking-widest italic opacity-80">{getCardLogoText(card.name)}</div></div>
            <div className="relative z-10 flex justify-between items-start mt-2"><h3 className="text-xl font-bold text-white tracking-wide">{card.name}</h3></div>
            <div className="relative z-10 mt-4">
                <p className="text-white/60 text-xs uppercase mb-1">Cierre: Día {card.closing_day}</p>
                <div className="flex justify-between items-end"><div><p className="text-white/60 text-xs uppercase">Límite</p><p className="text-white font-mono text-lg">${card.limit.toLocaleString('es-AR')}</p></div></div>
            </div>
            <div className="relative z-10 flex gap-3 mt-4">
                <button onClick={() => openExpenseModal(card)} className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 backdrop-blur-md transition"><ShoppingCart size={16} /> Compra</button>
                <button onClick={() => handleViewSummary(card)} className="flex-1 bg-black/20 hover:bg-black/40 text-white py-2 rounded-lg text-sm font-medium backdrop-blur-md transition">Ver Resumen</button>
            </div>
          </div>
        ))}
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
           <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 w-full max-w-sm shadow-2xl">
                <h3 className="text-white font-bold mb-4 text-lg">Nueva Tarjeta</h3>
                <form onSubmit={handleCreateCard} className="space-y-3">
                    <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" placeholder="Nombre (Ej: Visa Santander)" onChange={e => setNewCardData({...newCardData, name: e.target.value})} required />
                    <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" type="number" placeholder="Límite" onChange={e => setNewCardData({...newCardData, limit: e.target.value})} required />
                    <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" type="number" placeholder="Día Cierre" onChange={e => setNewCardData({...newCardData, closing_day: e.target.value})} required />
                    <div className="flex gap-2 mt-4"><button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 bg-slate-800 text-white p-2 rounded-lg">Cancelar</button><button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded-lg">Guardar</button></div>
                </form>
            </div>
        </div>
      )}

      {isExpenseModalOpen && selectedCard && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">
                <h3 className="text-white font-bold mb-6 text-xl flex items-center gap-2"><ShoppingCart className="text-blue-400" /> Nueva Compra</h3>
                <form onSubmit={submitExpense} className="space-y-4">
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                        <button type="button" onClick={() => setExpenseData({...expenseData, currency: 'ARS'})} className={`flex-1 py-2 rounded-md text-sm font-medium transition ${expenseData.currency === 'ARS' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500'}`}>Pesos (ARS)</button>
                        <button type="button" onClick={() => setExpenseData({...expenseData, currency: 'USD'})} className={`flex-1 py-2 rounded-md text-sm font-medium transition ${expenseData.currency === 'USD' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500'}`}>Dólares (USD)</button>
                    </div>
                    <div><label className="block text-slate-400 text-sm mb-1">Fecha</label><div className="relative"><Clock className="absolute left-3 top-3 text-slate-500" size={18} /><input type="date" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:border-blue-500 outline-none cursor-pointer" value={expenseData.date} onChange={e => setExpenseData({...expenseData, date: e.target.value})} onClick={e => e.target.showPicker()} required /></div></div>
                    <div><label className="block text-slate-400 text-sm mb-1">Descripción</label><div className="relative"><FileText className="absolute left-3 top-3 text-slate-500" size={18} /><input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pl-10 text-white" placeholder="Ej: Zapatillas" value={expenseData.description} onChange={e => setExpenseData({...expenseData, description: e.target.value})} required /></div></div>
                    <div><label className="block text-slate-400 text-sm mb-1">Monto Total</label><div className="relative"><DollarSign className="absolute left-3 top-3 text-slate-500" size={18} /><input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pl-10 text-white" placeholder="0.00" value={expenseData.amount} onChange={e => setExpenseData({...expenseData, amount: e.target.value})} required /></div></div>
                    <div onClick={() => setExpenseData({...expenseData, is_recurring: !expenseData.is_recurring})} className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition ${expenseData.is_recurring ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-800 border-slate-700'}`}><div className={`w-5 h-5 rounded flex items-center justify-center border ${expenseData.is_recurring ? 'bg-blue-500 border-blue-500' : 'border-slate-500'}`}>{expenseData.is_recurring && <CheckCircle size={14} className="text-white"/>}</div><div><p className={`text-sm font-bold ${expenseData.is_recurring ? 'text-blue-400' : 'text-slate-400'}`}>Pago Recurrente</p></div></div>
                    {!expenseData.is_recurring && (<div><label className="block text-slate-400 text-sm mb-1">Cuotas</label><div className="relative"><Calendar className="absolute left-3 top-3 text-slate-500" size={18} /><select className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pl-10 text-white appearance-none" value={expenseData.installments} onChange={e => setExpenseData({...expenseData, installments: e.target.value})}>{[1,3,6,9,12,18,24].map(n => (<option key={n} value={n}>{n === 1 ? '1 pago' : `${n} cuotas`}</option>))}</select></div></div>)}
                    <div className="flex gap-3 mt-6"><button type="button" onClick={() => setIsExpenseModalOpen(false)} className="flex-1 bg-slate-800 text-white p-3 rounded-lg">Cancelar</button><button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg font-bold">Guardar</button></div>
                </form>
            </div>
        </div>
      )}

      {isSummaryOpen && selectedCard && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="bg-slate-800 p-5 flex justify-between items-start border-b border-slate-700">
                    <div><h3 className="text-white font-bold text-lg mb-1">Resumen: {monthName}</h3><div className="flex gap-4 text-sm"><span className="text-slate-400">ARS: <strong className="text-emerald-400">${totalARS.toLocaleString('es-AR')}</strong></span><span className="text-slate-400">USD: <strong className="text-blue-400">US$ {totalUSD.toLocaleString('en-US')}</strong></span></div></div>
                    <button onClick={() => setIsSummaryOpen(false)} className="text-slate-400 hover:text-white bg-slate-700/50 p-2 rounded-full"><X size={20} /></button>
                </div>
                <div className="overflow-y-auto p-4 flex-1">
                    {visiblePurchases.length === 0 ? <div className="text-center py-10 text-slate-500">Nada para pagar.</div> : (
                        <table className="w-full text-left text-sm">
                            <thead><tr className="text-slate-500 text-xs uppercase border-b border-slate-800"><th className="pb-2">Fecha</th><th className="pb-2">Desc</th><th className="pb-2">Estado</th><th className="pb-2 text-right">Monto</th><th></th></tr></thead>
                            <tbody className="divide-y divide-slate-800">{visiblePurchases.map((p) => (<tr key={p.id} className="hover:bg-slate-800/30"><td className="py-3 text-slate-500 text-xs">{p.date}</td><td className="py-3 text-white">{p.description}</td>
                            <td className="py-3">
                                {p.active ? (
                                    <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-xs border border-purple-500/30 flex w-fit items-center gap-1"><Repeat size={10} /> {p.label}</span>
                                ) : (
                                    <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-xs border border-blue-500/30 font-mono">{p.label}</span>
                                )}
                            </td>
                            <td className="py-3 text-right text-slate-200">{p.currency === 'USD' ? 'US$ ' : '$ '}{p.amount.toLocaleString()}</td><td className="py-3 text-center"><button onClick={() => handleDeletePurchase(p.id)} className="text-slate-600 hover:text-red-500"><Trash2 size={16} /></button></td></tr>))}</tbody>
                        </table>
                    )}
                </div>
                <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-3">
                    <button onClick={() => setIsSummaryOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cerrar</button>
                    {(totalARS > 0 || totalUSD > 0) && <button onClick={openPayModal} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><CheckCircle size={18} /> Registrar Pago</button>}
                </div>
            </div>
        </div>
      )}

      {isPayModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl relative">
                <h3 className="text-white font-bold mb-6 text-xl flex items-center gap-2"><CheckCircle className="text-emerald-400" /> Confirmar Pago</h3>
                <form onSubmit={confirmPayment} className="space-y-5">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2"><div className="flex justify-between text-sm"><span className="text-slate-400">Total Pesos:</span><span className="text-white font-medium">${totalARS.toLocaleString('es-AR')}</span></div>{totalUSD > 0 && (<div className="flex justify-between text-sm"><span className="text-slate-400">Total Dólares:</span><span className="text-blue-400 font-medium">US$ {totalUSD.toLocaleString('en-US')}</span></div>)}</div>
                    <div><label className="block text-slate-400 text-sm mb-2 flex items-center gap-2"><Wallet size={16}/> Pagar desde cuenta:</label><select value={payAccountId} onChange={e => setPayAccountId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none" required><option value="">Seleccionar...</option>{accounts.map(acc => (<option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>))}</select></div>
                    {totalUSD > 0 && (<div><label className="block text-slate-400 text-sm mb-2 flex items-center gap-2"><DollarSign size={16}/> Cotización Dólar:</label><input type="number" value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none" required={totalUSD > 0}/></div>)}
                    <div className="pt-4 border-t border-slate-800 flex justify-between items-center"><span className="text-slate-400 font-medium">Total a descontar:</span><span className="text-2xl font-bold text-emerald-400">${estimatedTotal.toLocaleString('es-AR')}</span></div>
                    <div className="flex gap-3 mt-6"><button type="button" onClick={() => setIsPayModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-xl font-medium" disabled={isPaying}>Cancelar</button><button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-xl font-bold flex justify-center items-center gap-2 relative" disabled={isPaying}>{isPaying ? <Loader2 size={20} className="animate-spin" /> : "Confirmar Pago"}</button></div>
                </form>
            </div>
        </div>
      )}
    </div>
  )
}
export default CreditCards