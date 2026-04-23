import { useEffect, useState } from 'react'
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const inputCls = 'w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500'

export default function Budgets() {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [month, setMonth] = useState(currentMonth())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ category_id: '', amount: '' })
  const [editing, setEditing] = useState({}) // { [id]: { amount, applyForward } }

  const load = () => api.get(`/budgets?month=${month}`).then((r) => setBudgets(r.data))
  useEffect(() => { load() }, [month])
  useEffect(() => { api.get('/categories').then((r) => setCategories(r.data)) }, [])

  const submit = async (e) => {
    e.preventDefault()
    await api.post('/budgets', { ...form, amount: parseFloat(form.amount), month, category_id: parseInt(form.category_id) })
    setShowForm(false)
    setForm({ category_id: '', amount: '' })
    load()
  }

  const saveEdit = async (id) => {
    const { amount, applyForward } = editing[id]
    await api.put(`/budgets/${id}`, { amount: parseFloat(amount), apply_forward: applyForward })
    setEditing((prev) => { const n = { ...prev }; delete n[id]; return n })
    load()
  }

  const cancelEdit = (id) => {
    setEditing((prev) => { const n = { ...prev }; delete n[id]; return n })
  }

  const remove = async (id) => {
    await api.delete(`/budgets/${id}`)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Family Budgets</h2>
        <div className="flex items-center gap-3">
          <input
            type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {user?.is_admin && (
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition">
              <PlusIcon className="w-4 h-4" /> Add Budget
            </button>
          )}
        </div>
      </div>

      {showForm && user?.is_admin && (
        <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Category</label>
            <select required value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className={inputCls}>
              <option value="">Select…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="w-36">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Budget ($)</label>
            <input required type="number" min="1" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputCls} />
          </div>
          <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">Save</button>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {budgets.length === 0 && (
          <p className="text-gray-400 text-sm col-span-3 text-center py-10">No budgets set for this month</p>
        )}
        {budgets.map((b) => {
          const pct = Math.min((b.spent / b.amount) * 100, 100)
          const over = b.spent > b.amount
          const isEditing = editing[b.id] !== undefined

          return (
            <div key={b.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: b.category.color }} />
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{b.category.name}</span>
                </div>
                {user?.is_admin && (
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <button onClick={() => saveEdit(b.id)} className="text-green-500 hover:text-green-600 transition"><CheckIcon className="w-4 h-4" /></button>
                        <button onClick={() => cancelEdit(b.id)} className="text-gray-400 hover:text-gray-600 transition"><XMarkIcon className="w-4 h-4" /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setEditing((prev) => ({ ...prev, [b.id]: { amount: String(b.amount), applyForward: true } }))} className="text-gray-300 dark:text-gray-600 hover:text-indigo-500 transition"><PencilIcon className="w-4 h-4" /></button>
                        <button onClick={() => remove(b.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition"><TrashIcon className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="mb-3 space-y-2">
                  <input
                    type="number" min="1" step="0.01"
                    value={editing[b.id].amount}
                    onChange={(e) => setEditing((prev) => ({ ...prev, [b.id]: { ...prev[b.id], amount: e.target.value } }))}
                    className="w-full border border-indigo-400 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editing[b.id].applyForward}
                      onChange={(e) => setEditing((prev) => ({ ...prev, [b.id]: { ...prev[b.id], applyForward: e.target.checked } }))}
                      className="accent-indigo-600 w-3.5 h-3.5"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Apply to all future months</span>
                  </label>
                </div>
              ) : (
                <p className={`text-xs font-medium mb-3 ${over ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                  ${b.spent.toFixed(2)} / ${b.amount.toFixed(2)}
                </p>
              )}

              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${over ? 'bg-red-500' : 'bg-indigo-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                {over
                  ? `$${(b.spent - b.amount).toFixed(2)} over budget`
                  : `$${(b.amount - b.spent).toFixed(2)} remaining`}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
