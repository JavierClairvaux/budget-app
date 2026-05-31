import { useEffect, useState } from 'react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

const COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#ec4899','#8b5cf6','#14b8a6']

export default function Categories() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [type, setType] = useState('expense')

  const load = () => api.get('/categories').then((r) => setCategories(r.data))
  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    await api.post('/categories', { name, color, type })
    setName('')
    load()
  }

  const remove = async (id) => {
    await api.delete(`/categories/${id}`)
    load()
  }

  const toggleType = async (cat) => {
    const next = (cat.type || 'expense') === 'expense' ? 'income' : 'expense'
    await api.patch(`/categories/${cat.id}`, { type: next })
    load()
  }

  return (
    <div className="space-y-4 max-w-lg">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Categories</h2>

      {user?.is_admin && (
        <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name</label>
            <input
              required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Groceries"
              className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type</label>
            <div className="flex gap-2">
              {['expense', 'income'].map((t) => (
                <button
                  key={t} type="button"
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                    type === t
                      ? t === 'income'
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                        : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Color</label>
              <div className="flex gap-1.5 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c} type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition ${color === c ? 'ring-2 ring-offset-1 ring-gray-400 dark:ring-offset-gray-800' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <button type="submit" className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition shrink-0">
              <PlusIcon className="w-4 h-4" /> Add
            </button>
          </div>
        </form>
      )}

      {['expense', 'income'].map((groupType) => {
        const items = categories.filter((c) => (c.type || 'expense') === groupType)
        return (
          <div key={groupType}>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{groupType}</p>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm divide-y divide-gray-50 dark:divide-gray-700">
              {items.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No {groupType} categories</p>
              ) : items.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
                  </div>
                  {user?.is_admin && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleType(cat)}
                        title={`Switch to ${groupType === 'expense' ? 'income' : 'expense'}`}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide transition ${
                          groupType === 'income'
                            ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60'
                            : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/60'
                        }`}
                      >
                        {groupType}
                      </button>
                      <button onClick={() => remove(cat.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
