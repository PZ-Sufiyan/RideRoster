import React from 'react'
import { MdClose } from 'react-icons/md'

/**
 * Read-only popup for job session notes on driver detail job history.
 */
export default function SessionNoteModal({ open, note, sessionLabel, onClose }) {
  if (!open) return null

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
        aria-labelledby="session-note-title"
        className="relative z-10 w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h2 id="session-note-title" className="text-sm font-semibold text-gray-900">
              Session notes
            </h2>
            {sessionLabel ? (
              <p className="text-xs text-gray-500 mt-0.5">{sessionLabel}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <MdClose size={18} />
          </button>
        </div>
        <div className="px-4 py-4 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{note}</p>
        </div>
      </div>
    </div>
  )
}
