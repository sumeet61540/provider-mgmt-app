import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext({ showToast: () => {} })

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, duration = 3000) => {
    setToast(message)
    setTimeout(() => setToast(null), duration)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-sf-dark text-white px-5 py-3 rounded-lg text-sm font-semibold flex items-center gap-2.5 shadow-2xl z-[60]">
          <span className="w-2 h-2 rounded-full bg-sf-teal" />
          {toast}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
