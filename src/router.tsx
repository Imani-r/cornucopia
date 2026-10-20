import { createHashRouter } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { BudgetPage } from './pages/BudgetPage'
import { DashboardPage } from './pages/DashboardPage'
import { ImportPage } from './pages/ImportPage'

// Hash routes (/#/budget) because a static host like GitHub Pages can't serve index.html for /budget.
export const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/budget', element: <BudgetPage /> },
      { path: '/import', element: <ImportPage /> },
    ],
  },
])
