import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdSettings,
    MdDoneAll,
    MdWarning,
    MdCheckCircle,
    MdDescription,
    MdPersonAdd,
    MdDirectionsBus,
    MdPersonOff,
    MdTimer,
    MdDirectionsCar,
} from 'react-icons/md';
import { subscribeAdminNotificationRealtime } from '../../../../services/adminNotificationRealtimeService';
import {
    NOTIFICATION_TABS,
    NOTIFICATION_ROLES,
    filterNotificationsByTab,
    groupNotificationsByDate,
    markAllNotificationsRead,
    markNotificationsRead,
} from '../../../../services/adminNotificationService';
import { useNotificationsList } from '../../../../hooks/useNotificationsList';
import { ToastStack } from '../../../../utils/Toast';

const TABS = Object.values(NOTIFICATION_TABS);
const ITEMS_PER_PAGE = 5;
const ROLE = NOTIFICATION_ROLES.ADMIN;

const ICON_MAP = {
    MdWarning,
    MdCheckCircle,
    MdDescription,
    MdPersonAdd,
    MdDirectionsBus,
    MdPersonOff,
    MdTimer,
    MdDirectionsCar,
};

const NotificationItem = ({ item, onOpen }) => {
    const Icon = ICON_MAP[item.IconName] || MdDescription;

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onOpen(item)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpen(item);
                }
            }}
            className={`flex items-start px-5 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors bg-white cursor-pointer ${
                item.isNew ? 'bg-blue-50/20' : ''
            }`}
        >
            {item.isNew === true && (
                <div className="w-2 h-2 rounded-full bg-[#005580] mt-3.5 mr-3 shrink-0" />
            )}
            {item.isNew === false && (
                <div className="w-2 h-2 rounded-full bg-gray-200 mt-3.5 mr-3 shrink-0" />
            )}

            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mr-4 mt-0.5 ${item.iconColor}`}>
                <Icon size={18} />
            </div>

            <div className="flex-1 mt-0.5 pr-4">
                <p className="text-sm text-gray-800">
                    <span className="font-bold mr-1.5">{item.title}</span>
                    <span className="text-gray-600">{item.content}</span>
                </p>
                {item.linkText && (
                    <span className="inline-block mt-1 text-sm font-bold text-[#005580] hover:underline">
                        {item.linkText}
                    </span>
                )}
                <p className="text-xs text-gray-400 mt-1.5">{item.time}</p>
            </div>
        </div>
    );
};

const NotificationPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(NOTIFICATION_TABS.ALL);
    const [currentPage, setCurrentPage] = useState(1);
    const [toasts, setToasts] = useState([]);
    const {
        notifications,
        userId,
        companyId,
        loading,
        error,
        reload,
        refresh,
        setNotifications,
    } = useNotificationsList(ROLE);

    const pushToast = useCallback((type, message) => {
        setToasts((prev) => [
            ...prev,
            {
                id: `${Date.now()}-${Math.random()}`,
                type,
                message,
                autoClose: true,
                duration: 3500,
            },
        ]);
    }, []);

    useEffect(() => {
        if (!companyId) return undefined;

        return subscribeAdminNotificationRealtime(companyId, () => {
            refresh();
        });
    }, [companyId, refresh]);

    const filtered = useMemo(
        () => filterNotificationsByTab(notifications, activeTab),
        [notifications, activeTab],
    );

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const paginated = filtered.slice(
        (safePage - 1) * ITEMS_PER_PAGE,
        safePage * ITEMS_PER_PAGE,
    );
    const grouped = useMemo(() => groupNotificationsByDate(paginated), [paginated]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const handleOpenNotification = async (item) => {
        if (userId) {
            await markNotificationsRead(userId, [item.key], ROLE);
            setNotifications((prev) =>
                prev.map((n) => (n.key === item.key ? { ...n, isNew: false } : n)),
            );
        }
        if (item.linkTo) navigate(item.linkTo);
    };

    const handleMarkAllRead = async () => {
        if (!userId) return;
        const keys = notifications.map((n) => n.key);
        await markAllNotificationsRead(userId, keys, ROLE);
        setNotifications((prev) => prev.map((n) => ({ ...n, isNew: false })));
        pushToast('success', 'All notifications marked as read.');
    };

    const getPageNumbers = () => {
        if (totalPages <= 5) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const pages = [1];
        if (safePage > 3) pages.push('...');
        const start = Math.max(2, safePage - 1);
        const end = Math.min(totalPages - 1, safePage + 1);
        for (let i = start; i <= end; i += 1) pages.push(i);
        if (safePage < totalPages - 2) pages.push('...');
        pages.push(totalPages);
        return pages;
    };

    const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1;
    const rangeEnd = Math.min(safePage * ITEMS_PER_PAGE, filtered.length);

    return (
        <div className="space-y-6">
            <ToastStack
                toasts={toasts}
                onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
            />

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        View and manage all your recent updates and alerts.
                    </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={handleMarkAllRead}
                        disabled={loading || notifications.every((n) => !n.isNew)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <MdDoneAll size={18} />
                        Mark all as read
                    </button>
                    <button
                        type="button"
                        className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors shadow-sm bg-white"
                        aria-label="Notification settings"
                        onClick={() => navigate('/portal/settings')}
                    >
                        <MdSettings size={20} />
                    </button>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)] overflow-hidden">
                <div className="flex overflow-x-auto border-b border-gray-100 hide-scrollbar pt-2 px-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => {
                                setActiveTab(tab);
                                setCurrentPage(1);
                            }}
                            className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                                activeTab === tab
                                    ? 'text-[#005580] border-[#005580]'
                                    : 'text-gray-500 border-transparent hover:text-gray-700'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div>
                    {loading && notifications.length === 0 && (
                        <div className="py-16 text-center text-sm text-gray-400">
                            Loading notifications…
                        </div>
                    )}

                    {error && notifications.length === 0 && (
                        <div className="py-16 text-center">
                            <p className="text-sm text-red-500">{error}</p>
                            <button
                                type="button"
                                onClick={reload}
                                className="mt-3 text-sm font-semibold text-[#005580] hover:underline"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {!loading && !error && paginated.length === 0 && (
                        <div className="py-16 text-center text-gray-400 text-sm">
                            No notifications found.
                        </div>
                    )}

                    {paginated.length > 0 && grouped.map((group) => (
                        <div key={group.label}>
                            <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100">
                                <h2 className="text-xs font-bold text-gray-500">{group.label}</h2>
                            </div>
                            <div>
                                {group.items.map((item) => (
                                    <NotificationItem
                                        key={item.key}
                                        item={item}
                                        onOpen={handleOpenNotification}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/30">
                    <span className="text-sm text-gray-500 font-medium">
                        Showing {rangeStart}-{rangeEnd} of {filtered.length} notification
                        {filtered.length === 1 ? '' : 's'}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => handlePageChange(safePage - 1)}
                            disabled={safePage === 1 || filtered.length === 0}
                            className="px-3 py-1.5 border border-gray-200 rounded text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>

                        {getPageNumbers().map((page, idx) =>
                            page === '...' ? (
                                <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 text-sm font-medium">
                                    …
                                </span>
                            ) : (
                                <button
                                    key={page}
                                    type="button"
                                    onClick={() => handlePageChange(page)}
                                    className={`w-8 h-8 flex items-center justify-center border rounded text-sm font-medium transition-colors ${
                                        safePage === page
                                            ? 'text-white bg-[#005580] border-[#005580]'
                                            : 'border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'
                                    }`}
                                >
                                    {page}
                                </button>
                            ),
                        )}

                        <button
                            type="button"
                            onClick={() => handlePageChange(safePage + 1)}
                            disabled={safePage === totalPages || filtered.length === 0}
                            className="px-4 py-1.5 border border-gray-200 rounded text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};

export default NotificationPage;
