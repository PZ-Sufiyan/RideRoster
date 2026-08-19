import React from 'react';
import { MdClose, MdSearch, MdWarning } from 'react-icons/md';

export function AlertDialog({ open, title, message, onClose, confirmLabel = 'OK' }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
                <div className="flex items-center gap-2 mb-3">
                    <MdWarning className="text-orange-500 shrink-0" size={22} />
                    <h2 className="text-[18px] font-bold text-gray-900">{title}</h2>
                </div>
                <p className="text-[13px] text-gray-600 mb-6">{message}</p>
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full px-4 py-2.5 bg-[#005580] text-white rounded-xl text-sm font-semibold hover:bg-[#004663]"
                >
                    {confirmLabel}
                </button>
            </div>
        </div>
    );
}

export function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    busy = false,
    danger = false,
    onConfirm,
    onClose,
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !busy && onClose()} />
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
                <h2 className="text-[18px] font-bold text-gray-900 mb-2">{title}</h2>
                <p className="text-[13px] text-gray-600 mb-6">{message}</p>
                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        disabled={busy}
                        onClick={onClose}
                        className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={onConfirm}
                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 ${
                            danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#005580] hover:bg-[#004663]'
                        }`}
                    >
                        {busy ? 'Please wait…' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function AssignDriverPickerModal({
    open,
    title = 'Assign driver',
    query,
    onQueryChange,
    rows,
    loadingId,
    onPick,
    onClose,
    banner = 'Only approved company drivers without a vehicle are shown.',
    emptyText = 'No approved company drivers are available. Drivers must be approved and not already assigned to a vehicle.',
    pickLabel = 'Assign',
    pickingLabel = 'Assigning…',
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-[620px] bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="px-8 py-6 flex items-center justify-between border-b border-gray-100 shrink-0">
                    <h2 className="text-[20px] font-bold text-gray-900">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                    >
                        <MdClose size={24} />
                    </button>
                </div>
                <div className="p-8 space-y-5 overflow-y-auto">
                    {banner ? (
                        <div className="flex items-start gap-2 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-[12px] text-blue-700">
                            <span>{banner}</span>
                        </div>
                    ) : null}
                    <div className="relative">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => onQueryChange(e.target.value)}
                            placeholder="Search driver by name or license..."
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10"
                        />
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {rows.length === 0 && (
                            <div className="px-4 py-6 text-center text-[13px] text-gray-500 border border-dashed border-gray-200 rounded-2xl">
                                {emptyText}
                            </div>
                        )}
                        {rows.map((row) => {
                            const isLoading = loadingId === row.id;
                            return (
                                <div
                                    key={row.id}
                                    className="p-4 border border-gray-100 rounded-2xl flex items-center justify-between gap-3"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <img
                                            src={row.avatar}
                                            alt=""
                                            className="w-10 h-10 rounded-full object-cover border border-gray-100 shrink-0"
                                        />
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{row.name}</p>
                                            <p className="text-[12px] text-gray-400 truncate">{row.sub}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={isLoading}
                                        onClick={() => onPick(row)}
                                        className="shrink-0 px-4 py-2 rounded-xl text-[12px] font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        {isLoading ? pickingLabel : pickLabel}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
