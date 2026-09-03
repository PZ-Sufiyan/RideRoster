import React, { useEffect, useRef } from 'react'
import { useOptionalAppToast } from '../context/toastContext'
import { ToastStackView } from './ToastView'

/**
 * Page-level toast stack. Inside the dashboard ToastProvider, toasts are
 * forwarded into the shared top-right queue so action + notification toasts
 * appear in sequence instead of overlapping.
 */
export function ToastStack({ toasts = [], onClose, placement = 'top-right' }) {
  const shared = useOptionalAppToast()
  const forwardedIdsRef = useRef(new Set())

  useEffect(() => {
    if (!shared?.pushToast) return undefined

    for (const toast of toasts) {
      if (!toast?.id || forwardedIdsRef.current.has(toast.id)) continue
      forwardedIdsRef.current.add(toast.id)
      shared.pushToast({
        id: toast.id,
        type: toast.type || 'info',
        title: toast.title,
        message: toast.message || '',
        autoClose: toast.autoClose !== false,
        duration: toast.duration ?? 3500,
      })
      onClose?.(toast.id)
    }

    return undefined
  }, [toasts, shared, onClose])

  if (shared) return null

  return (
    <ToastStackView
      toasts={toasts}
      onClose={onClose}
      placement={placement}
    />
  )
}
