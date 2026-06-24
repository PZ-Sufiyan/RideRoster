import React, { useEffect, useState } from 'react'
import { MdClose, MdSend } from 'react-icons/md'
import { sendDriverMessage } from '../services/userNotificationService'

const MAX_MESSAGE_LEN = 1000

/**
 * @param {{
 *   open: boolean,
 *   driverId: string|null,
 *   driverName?: string,
 *   onClose: () => void,
 *   onSent?: () => void,
 * }} props
 */
export default function SendDriverMessageModal({
  open,
  driverId,
  driverName = 'Driver',
  onClose,
  onSent,
}) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) {
      setMessage('')
      setError(null)
      setSending(false)
    }
  }, [open])

  if (!open) return null

  const handleSend = async () => {
    const text = message.trim()
    if (!text || !driverId) return

    setSending(true)
    setError(null)
    try {
      await sendDriverMessage({ driverId, message: text })
      setMessage('')
      onSent?.()
      onClose()
    } catch (e) {
      setError(e?.message || 'Could not send message.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-driver-message-title"
        className="relative z-10 w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h2 id="send-driver-message-title" className="text-sm font-semibold text-gray-900">
              Send message
            </h2>
            <p className="text-xs text-gray-500">To {driverName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Close dialog"
          >
            <MdClose size={18} />
          </button>
        </div>

        <div className="space-y-3 p-4">
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          ) : null}

          <textarea
            rows={5}
            maxLength={MAX_MESSAGE_LEN}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message…"
            className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#005580] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#005580]"
            autoFocus
          />
          <p className="text-right text-[10px] tabular-nums text-gray-400">
            {message.length}/{MAX_MESSAGE_LEN}
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#005580] px-3 py-2 text-xs font-semibold text-white hover:bg-[#004663] disabled:opacity-50"
          >
            <MdSend size={14} />
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
