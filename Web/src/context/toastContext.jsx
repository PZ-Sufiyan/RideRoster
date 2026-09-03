/* eslint-disable react-refresh/only-export-components -- context + hook pattern */
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { ToastStackView } from '../utils/ToastView'

const ToastContext = createContext(null)

function makeToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Shared toast queue for the dashboard shell.
 * Action feedback and realtime notification toasts all stack top-right in sequence.
 */
export function ToastProvider({ children, placement = 'top-right' }) {
  const [toasts, setToasts] = useState([])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  /**
   * pushToast('success', 'Saved')
   * pushToast('error', 'Failed', { duration: 5000 })
   * pushToast({ type, title, message, duration, autoClose })
   */
  const pushToast = useCallback((typeOrToast, message, options = {}) => {
    if (typeOrToast && typeof typeOrToast === 'object' && !Array.isArray(typeOrToast)) {
      const toast = typeOrToast
      setToasts((prev) => [
        ...prev,
        {
          id: toast.id || makeToastId(),
          type: toast.type || 'info',
          title: toast.title,
          message: toast.message || '',
          autoClose: toast.autoClose !== false,
          duration: toast.duration ?? 3500,
        },
      ])
      return
    }

    setToasts((prev) => [
      ...prev,
      {
        id: makeToastId(),
        type: typeOrToast || 'info',
        message: message || '',
        autoClose: options.autoClose !== false,
        duration: options.duration ?? 3500,
        title: options.title,
      },
    ])
  }, [])

  const value = useMemo(
    () => ({ toasts, pushToast, dismissToast }),
    [toasts, pushToast, dismissToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastStackView toasts={toasts} onClose={dismissToast} placement={placement} />
    </ToastContext.Provider>
  )
}

export function useAppToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useAppToast must be used within ToastProvider')
  }
  return ctx
}

/** Safe for components that may render outside the dashboard shell. */
export function useOptionalAppToast() {
  return useContext(ToastContext)
}
