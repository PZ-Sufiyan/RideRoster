import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdCheckCircleOutline,
    MdChevronLeft,
    MdChevronRight,
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
    NOTIFICATION_ROLES,
    NOTIFICATION_TABS,
    filterNotificationsByTab,
    groupNotificationsByDate,
    markAllNotificationsRead,
    markNotificationsRead,
} from '../../../../services/adminNotificationService';
import { useNotificationsList } from '../../../../hooks/useNotificationsList';
import { ToastStack } from '../../../../utils/Toast';

const TABS = Object.values(NOTIFICATION_TABS);
const ITEMS_PER_PAGE = 10;
const ROLE = NOTIFICATION_ROLES.SUBADMIN;

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
            className={`flex items-start gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer ${
                item.isNew ? 'bg-blue-50/20' : ''
            }`}
        >
            <div className="w-2 mt-2 shrink-0 flex justify-center">
                {item.isNew && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 block" />
                )}
            </div>

            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${item.iconColor}`}>
                <Icon size={18} />
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 leading-snug">
                    <span className="font-semibold text-gray-900">{item.title}</span>{' '}
                    <span className="text-gray-600">{item.content}</span>
                </p>
                {item.linkText && (
                    <span className="inline-block mt-1.5 text-sm font-semibold text-[#005C7A] hover:underline">
                        {item.linkText}
                    </span>
                )}
                <p className="text-xs text-gray-400 mt-1.5">{item.time}</p>
            </div>
        </div>
    );
};

const SubAdmin_Notifications = () => {
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
        if (totalPages <= 3) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const pages = [1];
        if (safePage > 2) pages.push('...');
        if (safePage > 1 && safePage < totalPages) pages.push(safePage);
        if (safePage < totalPages - 1) pages.push('...');
        pages.push(totalPages);
        return pages;
    };

    const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1;
    const rangeEnd = Math.min(safePage * ITEMS_PER_PAGE, filtered.length);

    return (
        <div className="space-y-5">
            <ToastStack
                toasts={toasts}
                onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
            />

            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-[22px] font-bold text-gray-900">Notifications Center</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Manage and view all your recent updates and alerts.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleMarkAllRead}
                    disabled={loading || notifications.every((n) => !n.isNew)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <MdCheckCircleOutline size={16} className="text-gray-500" />
                    Mark All as Read
                </button>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 pt-5 pb-0 border-b border-gray-100">
                    <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[15px] font-bold text-gray-900 mr-3">Recent Notifications</span>
                        {TABS.map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => {
                                    setActiveTab(tab);
                                    setCurrentPage(1);
                                }}
                                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors mb-3 ${
                                    activeTab === tab
                                        ? 'bg-[#005C7A] text-white'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="divide-y divide-gray-50">
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
                                className="mt-3 text-sm font-semibold text-[#005C7A] hover:underline"
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
                            {group.items.map((item) => (
                                <NotificationItem
                                    key={item.key}
                                    item={item}
                                    onOpen={handleOpenNotification}
                                />
                            ))}
                        </div>
                    ))}
                </div>

                <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-500">
                        Showing <span className="font-medium text-gray-900">{rangeStart}</span> to{' '}
                        <span className="font-medium text-gray-900">{rangeEnd}</span> of{' '}
                        <span className="font-medium text-gray-900">{filtered.length}</span> results
                    </span>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => handlePageChange(safePage - 1)}
                            disabled={safePage === 1 || filtered.length === 0}
                            className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <MdChevronLeft size={18} />
                        </button>

                        {getPageNumbers().map((page, idx) =>
                            page === '...' ? (
                                <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 text-xs font-medium">
                                    …
                                </span>
                            ) : (
                                <button
                                    key={page}
                                    type="button"
                                    onClick={() => handlePageChange(page)}
                                    className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors border ${
                                        safePage === page
                                            ? 'bg-[#005C7A] text-white border-[#005C7A] shadow-sm'
                                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
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
                            className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <MdChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubAdmin_Notifications;
