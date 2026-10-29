import { Outlet } from 'react-router'
import { Sidebar } from './Sidebar'
import { TabBar } from './TabBar'

export function Layout() {
  return (
    <div className="flex min-h-dvh bg-bg">
      <Sidebar />
      <main className="w-full max-w-3xl mx-auto px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-24 md:pb-8">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
