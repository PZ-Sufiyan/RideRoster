import React, { useState } from 'react';
import {
    MdSettings,
    MdDoneAll,
    MdWarning,
    MdCheckCircle,
    MdDescription,
    MdPersonAdd,
    MdBadge,
    MdChevronLeft,
    MdChevronRight,
} from 'react-icons/md';

const TABS = ['All Notifications', 'Unread', 'SOS Alerts', 'Job Updates', 'System', 'Day-off Requests'];

const todayNotifications = [
    {
        id: 1,
        isNew: true,
        Icon: MdWarning,
        iconColor: 'text-red-500 bg-red-50',
        title: 'SOS Alert Triggered:',
        content: 'Vehicle #V-789 has triggered an SOS alert near downtown.',
        linkText: 'View Details',
        time: '15 minutes ago'
    },
    {
        id: 2,
        isNew: true,
        Icon: MdCheckCircle,
        iconColor: 'text-green-500 bg-green-50',
        title: 'Job #J-12345 Completed:',
        content: 'The morning route for "Westwood Elementary" has been successfully completed by driver John Doe.',
        time: '1 hour ago'
    },
    {
        id: 3,
        isNew: false,
        Icon: MdDescription,
        iconColor: 'text-orange-500 bg-orange-50',
        title: 'Counter-Offer Received:',
        content: 'A counter-offer has been received for Job #J-12377.',
        linkText: 'Review Now',
        time: '3 hours ago'
    }
];

const yesterdayNotifications = [
    {
        id: 4,
        isNew: null,
        Icon: MdPersonAdd,
        iconColor: 'text-[#005580] bg-blue-50',
        title: 'New Driver Added:',
        content: (
            <span>
                A new driver, <strong className="font-bold text-gray-800">Emily Carter</strong>, has been added to your company and is pending document verification.
            </span>
        ),
        time: '2025-11-17, 10:30 AM'
    },
    {
        id: 5,
        isNew: null,
        Icon: MdBadge,
        iconColor: 'text-yellow-600 bg-yellow-50',
        title: 'License Expiring Soon:',
        content: (
            <span>
                The driver's license for <strong className="font-bold text-gray-800">Michael B.</strong> is set to expire in 30 days. Please remind them to renew.
            </span>
        ),
        time: '2025-11-17, 9:00 AM'
    }
];

const NotificationItem = ({ item }) => (
    <div className="flex items-start px-5 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors bg-white">
        {/* Unread / Read Dot */}
        {item.isNew === true && <div className="w-2 h-2 rounded-full bg-[#005580] mt-3.5 mr-3 shrink-0" />}
        {item.isNew === false && <div className="w-2 h-2 rounded-full bg-gray-200 mt-3.5 mr-3 shrink-0" />}
        {item.isNew === null && <div className="w-2 h-2 mt-3.5 mr-3 shrink-0" />}

        {/* Icon */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mr-4 mt-0.5 ${item.iconColor}`}>
            <item.Icon size={18} />
        </div>

        {/* Content */}
        <div className="flex-1 mt-0.5 pr-4">
            <p className="text-sm text-gray-800">
                <span className="font-bold mr-1.5">{item.title}</span>
                <span className="text-gray-600">{item.content}</span>
            </p>
            {item.linkText && (
                <button className="text-sm font-bold text-[#005580] hover:underline mt-1">
                    {item.linkText}
                </button>
            )}
            <p className="text-xs text-gray-400 mt-1.5">{item.time}</p>
        </div>
    </div>
);

const NotificationPage = () => {
    const [activeTab, setActiveTab] = useState('All Notifications');

    return (
        <div className="space-y-6">

            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-sm text-gray-500 mt-1">View and manage all your recent updates and alerts.</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm bg-white">
                        <MdDoneAll size={18} />
                        Mark all as read
                    </button>
                    <button className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors shadow-sm bg-white">
                        <MdSettings size={20} />
                    </button>
                </div>
            </div>

            {/* ── Main Card ── */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)] overflow-hidden">

                {/* Tabs */}
                <div className="flex overflow-x-auto border-b border-gray-100 hide-scrollbar pt-2 px-2">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2
                                ${activeTab === tab
                                    ? 'text-[#005580] border-[#005580]'
                                    : 'text-gray-500 border-transparent hover:text-gray-700'
                                }
                            `}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* List Content */}
                <div>
                    {/* Today */}
                    <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100">
                        <h2 className="text-xs font-bold text-gray-500">Today</h2>
                    </div>
                    <div>
                        {todayNotifications.map(n => <NotificationItem key={n.id} item={n} />)}
                    </div>

                    {/* Yesterday */}
                    <div className="px-5 py-2.5 bg-gray-50 border-y border-gray-100">
                        <h2 className="text-xs font-bold text-gray-500">Yesterday</h2>
                    </div>
                    <div>
                        {yesterdayNotifications.map(n => <NotificationItem key={n.id} item={n} />)}
                    </div>
                </div>

                {/* Pagination (Matching Screenshot styling) */}
                <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/30">
                    <span className="text-sm text-gray-500 font-medium">
                        Showing 1-5 of 24 notifications
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button className="px-3 py-1.5 border border-gray-200 rounded text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors bg-white">
                            Previous
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors bg-white">
                            1
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors bg-white">
                            3
                        </button>
                        <span className="px-1 text-gray-400 text-sm font-medium">...</span>
                        <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors bg-white">
                            8
                        </button>
                        <button className="px-4 py-1.5 border border-gray-200 rounded text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors bg-white">
                            Next
                        </button>
                        {/* The arbitrary "2" block seen in the screenshot */}
                        <button className="w-8 h-8 flex items-center justify-center rounded text-sm font-medium text-white bg-[#005580]">
                            2
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
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
