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
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import api from '../api/client'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

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
  const [budgets, setBudgets] = useState([])
  const [incomeGoal, setIncomeGoal] = useState(null)
  const [editingGoal, setEditingGoal] = useState(null) // { amount, applyForward } | null
  const [month, setMonth] = useState(currentMonth())
  const { dark } = useTheme()
  const { user } = useAuth()

  useEffect(() => {
    api.get(`/summary?month=${month}`).then((r) => setSummary(r.data))
    api.get(`/budgets?month=${month}`).then((r) => setBudgets(r.data))
    api.get(`/income-goals?month=${month}`).then((r) => setIncomeGoal(r.data))
  }, [month])

  const saveIncomeGoal = async () => {
    const { data } = await api.put('/income-goals', {
      amount: parseFloat(editingGoal.amount),
      month,
      apply_forward: editingGoal.applyForward,
    })
    setIncomeGoal(data)
    setEditingGoal(null)
  }

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

  const totalPlanned = budgets.reduce((sum, b) => sum + b.amount, 0)
  const totalActual = summary.total_expenses
  const overTotal = totalActual > totalPlanned

  const plannedVsActual = {
    labels: ['This Month'],
    datasets: [
      {
        label: 'Planned',
        data: [totalPlanned],
        backgroundColor: '#a5b4fc',
        borderRadius: 6,
      },
      {
        label: 'Actual',
        data: [totalActual],
        backgroundColor: overTotal ? '#ef4444' : totalActual / totalPlanned >= 0.8 ? '#f59e0b' : '#6366f1',
        borderRadius: 6,
      },
    ],
  }

  const plannedIncome = incomeGoal?.amount || 0
  const actualIncome = summary.total_income
  const underIncome = plannedIncome > 0 && actualIncome < plannedIncome
  const incomeRatio = plannedIncome > 0 ? actualIncome / plannedIncome : 1

  const incomePlannedVsActual = {
    labels: ['This Month'],
    datasets: [
      {
        label: 'Goal',
        data: [plannedIncome],
        backgroundColor: '#86efac',
        borderRadius: 6,
      },
      {
        label: 'Actual',
        data: [actualIncome],
        backgroundColor: !plannedIncome
          ? '#22c55e'
          : actualIncome >= plannedIncome
            ? '#22c55e'
            : incomeRatio >= 0.8
              ? '#f59e0b'
              : '#ef4444',
        borderRadius: 6,
      },
    ],
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Income" value={summary.total_income} color="text-green-600 dark:text-green-400" />
        <StatCard label="Expenses" value={summary.total_expenses} color="text-red-500 dark:text-red-400" />
        <StatCard
          label="Balance"
          value={summary.balance}
          color={summary.balance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500 dark:text-red-400'}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Planned vs Actual Expenses</p>
            {budgets.length > 0 && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                overTotal
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                  : totalActual / totalPlanned >= 0.8
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
              }`}>
                {overTotal ? 'Over Budget' : totalActual / totalPlanned >= 0.8 ? 'Near Limit' : 'On Track'}
              </span>
            )}
          </div>
          {budgets.length > 0 && (
            <p className={`text-xs font-medium ${overTotal ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
              ${totalActual.toFixed(2)} / ${totalPlanned.toFixed(2)}
              {' '}({overTotal ? '+' : '-'}${Math.abs(totalActual - totalPlanned).toFixed(2)})
            </p>
          )}
        </div>
        {budgets.length > 0 ? (
          <Bar
            data={plannedVsActual}
            options={{
              ...chartOptions,
              plugins: {
                legend: { position: 'top', labels: { color: tickColor } },
                tooltip: {
                  callbacks: {
                    label: (ctx) => `${ctx.dataset.label}: $${ctx.parsed.y.toFixed(2)}`,
                  },
                },
              },
            }}
          />
        ) : (
          <p className="text-gray-400 text-sm text-center py-8">No budgets set for this month</p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Planned vs Actual Income</p>
            {plannedIncome > 0 && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                actualIncome >= plannedIncome
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                  : incomeRatio >= 0.8
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
                    : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
              }`}>
                {actualIncome >= plannedIncome ? 'Goal Met' : incomeRatio >= 0.8 ? 'Close to Goal' : 'Below Goal'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {plannedIncome > 0 && !editingGoal && (
              <p className={`text-xs font-medium ${underIncome ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                ${actualIncome.toFixed(2)} / ${plannedIncome.toFixed(2)}
                {' '}({actualIncome >= plannedIncome ? '+' : '-'}${Math.abs(actualIncome - plannedIncome).toFixed(2)})
              </p>
            )}
            {user?.is_admin && !editingGoal && (
              <button
                onClick={() => setEditingGoal({ amount: String(plannedIncome || ''), applyForward: true })}
                className="text-gray-300 dark:text-gray-600 hover:text-indigo-500 transition"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {editingGoal && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <input
              type="number" min="0" step="0.01" autoFocus
              placeholder="Income goal"
              value={editingGoal.amount}
              onChange={(e) => setEditingGoal({ ...editingGoal, amount: e.target.value })}
              className="border border-indigo-400 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={editingGoal.applyForward}
                onChange={(e) => setEditingGoal({ ...editingGoal, applyForward: e.target.checked })}
                className="accent-indigo-600 w-3.5 h-3.5"
              />
              Apply to future months
            </label>
            <button onClick={saveIncomeGoal} className="text-green-500 hover:text-green-600 transition"><CheckIcon className="w-4 h-4" /></button>
            <button onClick={() => setEditingGoal(null)} className="text-gray-400 hover:text-gray-600 transition"><XMarkIcon className="w-4 h-4" /></button>
          </div>
        )}

        {plannedIncome > 0 ? (
          <Bar
            data={incomePlannedVsActual}
            options={{
              ...chartOptions,
              plugins: {
                legend: { position: 'top', labels: { color: tickColor } },
                tooltip: {
                  callbacks: {
                    label: (ctx) => `${ctx.dataset.label}: $${ctx.parsed.y.toFixed(2)}`,
                  },
                },
              },
            }}
          />
        ) : (
          <p className="text-gray-400 text-sm text-center py-8">
            {user?.is_admin ? 'Set an income goal to track progress' : 'No income goal set'}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
