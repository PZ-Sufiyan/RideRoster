import React, { useEffect } from 'react';
import {
    HiCheckCircle,
    HiExclamationCircle,
    HiExclamation,
    HiInformationCircle,
    HiX,
} from 'react-icons/hi';

const TOAST_VARIANTS = {
    success: {
        bg: 'bg-[#16C35B]',
        icon: HiCheckCircle,
        title: 'Success',
    },
    error: {
        bg: 'bg-[#EF4444]',
        icon: HiExclamationCircle,
        title: 'Error',
    },
    warning: {
        bg: 'bg-[#EAB308]',
        icon: HiExclamation,
        title: 'Warning',
    },
    info: {
        bg: 'bg-[#2B7BA4]',
        icon: HiInformationCircle,
        title: 'Info',
    },
};

const Toast = ({
    type = 'info',
    title,
    message,
    onClose,
    autoClose = true,
    duration = 3000,
}) => {
    const variant = TOAST_VARIANTS[type] || TOAST_VARIANTS.info;
    const Icon = variant.icon;

    useEffect(() => {
        if (!autoClose || !onClose) return undefined;
        const timer = setTimeout(() => onClose(), duration);
        return () => clearTimeout(timer);
    }, [autoClose, duration, onClose]);

    return (
        <div
            role="status"
            className={`w-full rounded-md ${variant.bg} px-4 py-3 text-white shadow-md`}
        >
            <div className="flex items-center gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                    <Icon className="h-4 w-4 text-white" />
                </div>
                <p className="flex-1 text-sm font-semibold">
                    {title || variant.title}
                    {message ? ` ${message}` : ''}
                </p>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded p-0.5 text-white/90 hover:bg-white/20 hover:text-white"
                        aria-label="Close toast"
                    >
                        <HiX className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export const ToastStack = ({ toasts = [], onClose }) => {
    if (!toasts.length) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] w-[min(420px,calc(100vw-2rem))] space-y-2">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    type={toast.type}
                    title={toast.title}
                    message={toast.message}
                    duration={toast.duration}
                    autoClose={toast.autoClose}
                    onClose={onClose ? () => onClose(toast.id) : undefined}
                />
            ))}
        </div>
    );
};

export default Toast;
