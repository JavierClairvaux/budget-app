import { useEffect, useState } from 'react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const inputCls = 'w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500'
const labelCls = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'

export default function Transactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [month, setMonth] = useState(currentMonth())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    description: '', amount: '', date: new Date().toISOString().slice(0, 10),
    type: 'expense', category_id: '',
  })

  const load = () => {
    api.get(`/transactions?month=${month}`).then((r) => setTransactions(r.data))
  }

  useEffect(() => { load() }, [month])
  useEffect(() => { api.get('/categories').then((r) => setCategories(r.data)) }, [])

  const submit = async (e) => {
    e.preventDefault()
    await api.post('/transactions', {
      ...form,
      amount: parseFloat(form.amount),
      category_id: form.category_id ? parseInt(form.category_id) : null,
    })
    setShowForm(false)
    setForm({ description: '', amount: '', date: new Date().toISOString().slice(0, 10), type: 'expense', category_id: '' })
    load()
  }

  const remove = async (id) => {
    await api.delete(`/transactions/${id}`)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Transactions</h2>
        <div className="flex items-center gap-3">
          <input
            type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
          >
            <PlusIcon className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={labelCls}>Description</label>
            <input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Amount ($)</label>
            <input required type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Date</label>
            <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputCls}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className={inputCls}>
              <option value="">None</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">Save</button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {transactions.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">No transactions for this month</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                {['Date', 'Description', 'Category', 'Who', 'Type', 'Amount', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{tx.date}</td>
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-200 font-medium">{tx.description}</td>
                  <td className="px-4 py-3">
                    {tx.category ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tx.category.color }} />
                        {tx.category.name}
                      </span>
                    ) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{tx.user.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tx.type === 'income' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-semibold ${tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-gray-800 dark:text-gray-200'}`}>
                    {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    {(tx.user.id === user?.id || user?.is_admin) && (
                      <button onClick={() => remove(tx.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
