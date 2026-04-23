import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import {
  HomeIcon,
  ArrowsRightLeftIcon,
  TagIcon,
  ChartBarIcon,
  ArrowRightStartOnRectangleIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline'

const navItems = [
  { to: '/', label: 'Dashboard', icon: HomeIcon },
  { to: '/transactions', label: 'Transactions', icon: ArrowsRightLeftIcon },
  { to: '/budgets', label: 'Budgets', icon: ChartBarIcon },
  { to: '/categories', label: 'Categories', icon: TagIcon },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <aside className="w-56 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100 dark:border-gray-700">
          <p className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">Family Budget</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{user?.name}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 pb-4 space-y-1">
          <button
            onClick={toggle}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            {dark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
            {dark ? 'Light mode' : 'Dark mode'}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
