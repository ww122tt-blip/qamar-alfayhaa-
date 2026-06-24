'use client'

import { useState, useEffect, useCallback } from 'react'
import { Wallet, Plus, TrendingUp, TrendingDown, DollarSign, Loader2, X, Clock, Trash2, ChevronDown } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { CashBox } from '@/types'

interface Transaction {
  id: string
  cash_box_id: string
  type: 'deposit' | 'withdrawal'
  amount: number
  note: string | null
  created_by: string
  created_at: string
}

// ====== TRANSACTION MODAL ======
function TransactionModal({ box, type, onClose, onDone }: { box: CashBox; type: 'deposit' | 'withdrawal'; onClose: () => void; onDone: (newBalance: number) => void }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const isDeposit = type === 'deposit'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseFloat(amount)
    if (!num || num <= 0) { alert('أدخل مبلغاً صحيحاً'); return }
    if (!isDeposit && num > box.balance) { alert('الرصيد غير كافٍ!'); return }
    setLoading(true)

    const newBalance = isDeposit ? box.balance + num : box.balance - num
    const { error: txError } = await supabase.from('cash_transactions').insert([{
      cash_box_id: box.id, type, amount: num, note: note || null, created_by: 'Admin'
    }])
    const { error: boxError } = await supabase.from('cash_boxes').update({ balance: newBalance }).eq('id', box.id)

    if (!txError && !boxError) {
      await supabase.from('activity_logs').insert([{
        action: isDeposit ? 'إيداع' : 'سحب', entity_type: 'cash_box', entity_id: box.id,
        details: `${isDeposit ? 'إيداع' : 'سحب'} ${formatCurrency(num, box.currency)} ${isDeposit ? 'في' : 'من'} ${box.name}`, user_name: 'Admin'
      }])
      onDone(newBalance)
    } else {
      alert('حدث خطأ أثناء العملية')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
      <div className="glass-card w-full max-w-md animate-fade-in shadow-2xl">
        <div className={`flex items-center justify-between p-6 text-white ${isDeposit ? 'bg-blue-600' : 'bg-red-600'}`}>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20"><X size={20} /></button>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold">{isDeposit ? 'إيداع' : 'سحب'} - {box.name}</h2>
            {isDeposit ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
            <p className="text-xs text-slate-500 font-bold mb-1">الرصيد الحالي</p>
            <p className="text-2xl font-extrabold text-slate-800" dir="ltr">{formatCurrency(box.balance, box.currency)}</p>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-slate-700">المبلغ ({box.currency}) *</label>
            <input type="number" required min="1" step="any" value={amount} onChange={e => setAmount(e.target.value)}
              disabled={loading} className="input-field bg-white shadow-sm text-center text-xl font-bold" placeholder="0" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-slate-700">الملاحظة / السبب</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} disabled={loading}
              className="input-field bg-white shadow-sm" placeholder="مثال: استلام من عميل..." />
          </div>
          {amount && parseFloat(amount) > 0 && (
            <div className={`rounded-xl p-3 text-center text-sm font-bold ${isDeposit ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              الرصيد بعد العملية: {formatCurrency(isDeposit ? box.balance + parseFloat(amount) : box.balance - parseFloat(amount), box.currency)}
            </div>
          )}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button type="submit" disabled={loading} className={`btn-primary flex-1 justify-center py-3 shadow-md ${isDeposit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : isDeposit ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              تأكيد {isDeposit ? 'الإيداع' : 'السحب'}
            </button>
            <button type="button" onClick={onClose} disabled={loading} className="btn-ghost flex-1 justify-center py-3">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ====== ADD CASH BOX MODAL ======
function AddCashBoxModal({ onClose, onAdd }: { onClose: () => void; onAdd: (b: CashBox) => void }) {
  const [form, setForm] = useState({ name: '', currency: 'IQD', notes: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.from('cash_boxes').insert([{ name: form.name, currency: form.currency, balance: 0, notes: form.notes || null }]).select().single()
    if (data && !error) {
      onAdd(data as CashBox)
      onClose()
    } else {
      alert('حدث خطأ: ' + error?.message)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
      <div className="glass-card w-full max-w-md animate-fade-in shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200"><DollarSign size={20} className="text-gold" /></div>
            <h2 className="text-lg font-extrabold text-slate-800">إضافة صندوق جديد</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg hover:bg-slate-200 text-slate-500"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1.5 text-slate-700">اسم الصندوق *</label>
            <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} disabled={loading} className="input-field bg-white shadow-sm" placeholder="مثال: الصندوق الرئيسي" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1.5 text-slate-700">العملة *</label>
            <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} disabled={loading} className="input-field bg-white shadow-sm font-bold">
              <option value="IQD">د.ع - دينار عراقي</option>
              <option value="USD">$ - دولار أمريكي</option>
              <option value="KWD">د.ك - دينار كويتي</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1.5 text-slate-700">ملاحظات</label>
            <input type="text" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} disabled={loading} className="input-field bg-white shadow-sm" placeholder="ملاحظات اختيارية..." />
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-3 shadow-md">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} إضافة
            </button>
            <button type="button" onClick={onClose} disabled={loading} className="btn-ghost flex-1 justify-center py-3">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ====== TRANSACTIONS HISTORY MODAL ======
function TransactionsModal({ box, onClose }: { box: CashBox; onClose: () => void }) {
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('cash_transactions').select('*').eq('cash_box_id', box.id).order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => { if (data) setTxs(data as Transaction[]); setLoading(false) })
  }, [box.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
      <div className="glass-card w-full max-w-lg max-h-[85vh] overflow-y-auto animate-fade-in shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200"><Clock size={20} className="text-gold" /></div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">سجل المعاملات</h2>
              <p className="text-xs text-slate-500 font-bold">{box.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg hover:bg-slate-200 text-slate-500"><X size={18} /></button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={28} className="text-gold animate-spin" /></div>
          ) : txs.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Clock size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold">لا توجد معاملات بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {txs.map(tx => (
                <div key={tx.id} className="flex items-center justify-between bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tx.type === 'deposit' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                      {tx.type === 'deposit' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{tx.type === 'deposit' ? 'إيداع' : 'سحب'}</p>
                      {tx.note && <p className="text-xs text-slate-500">{tx.note}</p>}
                      <p className="text-xs text-slate-400">{formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <span className={`font-extrabold text-base ${tx.type === 'deposit' ? 'text-blue-600' : 'text-red-600'}`} dir="ltr">
                    {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount, box.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ====== MAIN PAGE ======
export default function CashBoxesPage() {
  const [boxes, setBoxes] = useState<CashBox[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [transactionModal, setTransactionModal] = useState<{ box: CashBox; type: 'deposit' | 'withdrawal' } | null>(null)
  const [historyBox, setHistoryBox] = useState<CashBox | null>(null)

  const fetchBoxes = useCallback(async () => {
    const { data } = await supabase.from('cash_boxes').select('*').order('created_at', { ascending: true })
    if (data) setBoxes(data as CashBox[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchBoxes() }, [fetchBoxes])

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="page-header">
        <div className="page-title">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200"><Wallet size={20} className="text-gold" /></div>
          <span className="text-slate-800">الصناديق</span>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary shadow-sm"><Plus size={18} /> إضافة صندوق</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={40} className="text-gold animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {boxes.map(box => (
            <div key={box.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50 border border-amber-100 shadow-sm">
                  <DollarSign size={24} className="text-gold" />
                </div>
                <span className="badge badge-delivered shadow-sm font-bold">{box.currency}</span>
              </div>
              <h3 className="font-bold text-slate-800 mb-1">{box.name}</h3>
              <p className="text-3xl font-extrabold text-green-600 tracking-tight mb-1" dir="ltr">{formatCurrency(box.balance, box.currency)}</p>
              {box.notes && <p className="text-xs text-slate-400 mb-3 font-medium">{box.notes}</p>}
              <div className="gold-divider opacity-50 my-4" />
              <div className="flex gap-2 flex-1 items-end">
                <button onClick={() => setTransactionModal({ box, type: 'deposit' })} className="btn-primary flex-1 justify-center text-sm py-2.5 shadow-sm bg-blue-600 hover:bg-blue-700">
                  <TrendingUp size={16} /> إيداع
                </button>
                <button onClick={() => setTransactionModal({ box, type: 'withdrawal' })} className="btn-primary flex-1 justify-center text-sm py-2.5 shadow-sm bg-red-600 hover:bg-red-700">
                  <TrendingDown size={16} /> سحب
                </button>
                <button onClick={() => setHistoryBox(box)} className="btn-ghost justify-center text-sm py-2.5 bg-slate-50 hover:bg-slate-100 shadow-sm px-3" title="السجل">
                  <Clock size={16} />
                </button>
              </div>
            </div>
          ))}

          {/* Add new box card */}
          <button onClick={() => setShowAddModal(true)} className="bg-slate-50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-300 cursor-pointer transition-all duration-300 hover:border-gold hover:bg-amber-50 group" style={{ minHeight: '220px' }}>
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
              <Plus size={24} className="text-slate-400 group-hover:text-gold" />
            </div>
            <span className="text-sm font-bold text-slate-500 group-hover:text-slate-800">إضافة صندوق جديد</span>
          </button>
        </div>
      )}

      {showAddModal && <AddCashBoxModal onClose={() => setShowAddModal(false)} onAdd={b => setBoxes(p => [...p, b])} />}
      {transactionModal && (
        <TransactionModal
          box={transactionModal.box} type={transactionModal.type}
          onClose={() => setTransactionModal(null)}
          onDone={newBalance => {
            setBoxes(p => p.map(b => b.id === transactionModal.box.id ? { ...b, balance: newBalance } : b))
            setTransactionModal(null)
          }}
        />
      )}
      {historyBox && <TransactionsModal box={historyBox} onClose={() => setHistoryBox(null)} />}
    </div>
  )
}
