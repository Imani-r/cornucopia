import { NavLink, Outlet } from 'react-router-dom'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'font-semibold text-slate-900' : 'text-slate-500 hover:text-slate-700'

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <h1 className="text-lg font-semibold sm:text-xl">cornucopia</h1>
          <nav className="flex gap-4 text-sm">
            <NavLink to="/" end className={linkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/budget" className={linkClass}>
              Budget
            </NavLink>
            <NavLink to="/import" className={linkClass}>
              Import
            </NavLink>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
