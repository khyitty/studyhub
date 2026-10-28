import { ToastProvider } from './components/ui'

export default function App() {
  return (
    <ToastProvider>
      <div className="mx-auto max-w-3xl p-4">
        <h1 className="text-2xl font-bold">StudyHub</h1>
      </div>
    </ToastProvider>
  )
}
