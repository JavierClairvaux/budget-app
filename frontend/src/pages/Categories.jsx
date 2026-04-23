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

  const load = () => api.get('/categories').then((r) => setCategories(r.data))
  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    await api.post('/categories', { name, color })
    setName('')
    load()
  }

  const remove = async (id) => {
    await api.delete(`/categories/${id}`)
    load()
  }

  return (
    <div className="space-y-4 max-w-lg">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Categories</h2>

      {user?.is_admin && (
        <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name</label>
            <input
              required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Groceries"
              className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Color</label>
            <div className="flex gap-1.5">
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
          <button type="submit" className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition">
            <PlusIcon className="w-4 h-4" /> Add
          </button>
        </form>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm divide-y divide-gray-50 dark:divide-gray-700">
        {categories.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">No categories yet</p>
        )}
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
            </div>
            {user?.is_admin && (
              <button onClick={() => remove(cat.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition">
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
