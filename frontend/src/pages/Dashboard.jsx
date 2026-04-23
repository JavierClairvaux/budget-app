import { useEffect, useState } from 'react'
import { Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'
import api from '../api/client'
import { useTheme } from '../context/ThemeContext'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
      <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>${Math.abs(value).toFixed(2)}</p>
    </div>
  )
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [month, setMonth] = useState(currentMonth())
  const { dark } = useTheme()

  useEffect(() => {
    api.get(`/summary?month=${month}`).then((r) => setSummary(r.data))
  }, [month])

  if (!summary) return <p className="text-gray-400">Loading…</p>

  const gridColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
  const tickColor = dark ? '#9ca3af' : '#6b7280'

  const donutData = {
    labels: summary.by_category.map((c) => c.name),
    datasets: [{
      data: summary.by_category.map((c) => c.total),
      backgroundColor: summary.by_category.map((c) => c.color),
      borderWidth: 0,
    }],
  }

  const barData = {
    labels: summary.by_user.map((u) => u.name),
    datasets: [{
      label: 'Spent',
      data: summary.by_user.map((u) => u.total),
      backgroundColor: '#6366f1',
      borderRadius: 6,
    }],
  }

  const chartOptions = {
    plugins: { legend: { labels: { color: tickColor } } },
    scales: {
      x: { ticks: { color: tickColor }, grid: { color: gridColor } },
      y: { beginAtZero: true, ticks: { color: tickColor }, grid: { color: gridColor } },
    },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h2>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Income" value={summary.total_income} color="text-green-600 dark:text-green-400" />
        <StatCard label="Expenses" value={summary.total_expenses} color="text-red-500 dark:text-red-400" />
        <StatCard
          label="Balance"
          value={summary.balance}
          color={summary.balance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500 dark:text-red-400'}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Spending by Category</p>
          {summary.by_category.length > 0 ? (
            <Doughnut data={donutData} options={{ plugins: { legend: { position: 'bottom', labels: { color: tickColor } } } }} />
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No expenses yet</p>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Spending by Member</p>
          {summary.by_user.length > 0 ? (
            <Bar data={barData} options={{ ...chartOptions, plugins: { legend: { display: false } } }} />
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No expenses yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
