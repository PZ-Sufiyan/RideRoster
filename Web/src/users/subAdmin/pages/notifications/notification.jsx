import React, { useState } from 'react';
import {
    MdCheckCircleOutline,
    MdChevronLeft,
    MdChevronRight,
} from 'react-icons/md';
import {
    HiOutlineCalendar,
    HiOutlineExclamation,
    HiOutlineUser,
    HiOutlineDocumentText,
} from 'react-icons/hi';

/* ─── Data ───────────────────────────────────────────────── */
const allNotifications = [
    {
        id: 1, unread: true,
        icon: <HiOutlineCalendar size={16} className="text-blue-600" />,
        iconBg: 'bg-blue-100',
        title: <>New Job Assigned: <span className="font-bold">#J-10582</span> for Bright Horizons School</>,
        body: 'A new job has been created and assigned to driver Michael Scott. Please review the details.',
        time: '5 minutes ago',
        action: { label: 'View Job Details' },
        tab: 'Job Updates',
    },
    {
        id: 2, unread: true,
        icon: <HiOutlineExclamation size={16} className="text-yellow-600" />,
        iconBg: 'bg-yellow-100',
        title: 'Action Required: Driver Document Expiring',
        body: <>The driver's license for <span className="font-bold"> Angela Martin </span> is set to expire in 15 days. Please ensure a new document is uploaded.</>,
        time: '2 hours ago',
        action: null,
        tab: 'System Alerts',
    },
    {
        id: 3, unread: false,
        icon: <HiOutlineUser size={16} className="text-green-600" />,
        iconBg: 'bg-green-100',
        title: 'New Driver Approved: Stanley Hudson',
        body: 'A new driver has been approved and is now available for job assignments.',
        time: '1 day ago',
        action: null,
        tab: 'System Alerts',
    },
    {
        id: 4, unread: false,
        icon: <HiOutlineDocumentText size={16} className="text-orange-600" />,
        iconBg: 'bg-orange-100',
        title: 'Counter-Offer Received for Job #J-10451',
        body: 'A driver has submitted a counter-offer for a pending job. Review and respond to the offer.',
        time: '2 days ago',
        action: { label: 'Review Offer' },
        tab: 'Job Updates',
    },
    {
        id: 5, unread: false,
        icon: <HiOutlineCalendar size={16} className="text-red-600" />,
        iconBg: 'bg-red-100',
        title: 'Job Cancelled: #J-10337',
        body: 'The job for Westside Middle School has been cancelled by the client.',
        time: '3 days ago',
        action: null,
        tab: 'Job Updates',
    },
    // Extra pages (not visible on page 1 but needed for pagination count = 23)
    { id: 6,  unread: false, icon: <HiOutlineCalendar size={16} className="text-blue-600" />,     iconBg: 'bg-blue-100',   title: 'New Job Assigned: #J-10580 for Oakridge Academy',    body: 'A new job has been created and assigned to driver Chris Lane.',                                         time: '4 days ago',  action: null, tab: 'Job Updates'   },
    { id: 7,  unread: false, icon: <HiOutlineExclamation size={16} className="text-yellow-600" />, iconBg: 'bg-yellow-100', title: 'Action Required: Vehicle Inspection Due',              body: 'Vehicle Ford Transit 2023 is due for inspection within 7 days.',                                       time: '4 days ago',  action: null, tab: 'System Alerts' },
    { id: 8,  unread: false, icon: <HiOutlineUser size={16} className="text-green-600" />,         iconBg: 'bg-green-100',  title: 'New Driver Approved: Mark Rivera',                    body: 'A new driver has been approved and is now available for job assignments.',                             time: '5 days ago',  action: null, tab: 'System Alerts' },
    { id: 9,  unread: false, icon: <HiOutlineDocumentText size={16} className="text-orange-600" />,iconBg: 'bg-orange-100', title: 'Counter-Offer Received for Job #J-10448',             body: 'A driver has submitted a counter-offer for a pending job.',                                            time: '5 days ago',  action: { label: 'Review Offer' }, tab: 'Job Updates' },
    { id: 10, unread: false, icon: <HiOutlineCalendar size={16} className="text-red-600" />,       iconBg: 'bg-red-100',    title: 'Job Cancelled: #J-10330',                             body: 'The job for Riverside Community Center has been cancelled by the client.',                             time: '6 days ago',  action: null, tab: 'Job Updates'   },
    { id: 11, unread: false, icon: <HiOutlineCalendar size={16} className="text-blue-600" />,      iconBg: 'bg-blue-100',   title: 'New Job Assigned: #J-10575 for Elmwood School',       body: 'A new job has been created and assigned to driver Tom Bradley.',                                       time: '7 days ago',  action: null, tab: 'Job Updates'   },
    { id: 12, unread: false, icon: <HiOutlineExclamation size={16} className="text-yellow-600" />, iconBg: 'bg-yellow-100', title: 'Action Required: PA Document Expiring',               body: 'The PA certificate for James Wong is set to expire in 10 days.',                                       time: '7 days ago',  action: null, tab: 'System Alerts' },
    { id: 13, unread: false, icon: <HiOutlineUser size={16} className="text-green-600" />,         iconBg: 'bg-green-100',  title: 'New Driver Approved: Rachel Kim',                     body: 'A new driver has been approved and is now available for job assignments.',                             time: '8 days ago',  action: null, tab: 'System Alerts' },
    { id: 14, unread: false, icon: <HiOutlineDocumentText size={16} className="text-orange-600" />,iconBg: 'bg-orange-100', title: 'Counter-Offer Received for Job #J-10440',             body: 'A driver has submitted a counter-offer.',                                                              time: '8 days ago',  action: { label: 'Review Offer' }, tab: 'Job Updates' },
    { id: 15, unread: false, icon: <HiOutlineCalendar size={16} className="text-red-600" />,       iconBg: 'bg-red-100',    title: 'Job Cancelled: #J-10320',                             body: 'The job for North Street Academy has been cancelled.',                                                 time: '9 days ago',  action: null, tab: 'Job Updates'   },
    { id: 16, unread: false, icon: <HiOutlineCalendar size={16} className="text-blue-600" />,      iconBg: 'bg-blue-100',   title: 'New Job Assigned: #J-10560 for Sunrise Learning',     body: 'A new job has been created and assigned to driver Alice Park.',                                        time: '10 days ago', action: null, tab: 'Job Updates'   },
    { id: 17, unread: false, icon: <HiOutlineExclamation size={16} className="text-yellow-600" />, iconBg: 'bg-yellow-100', title: 'System Alert: Scheduled Maintenance',                 body: 'The platform will undergo maintenance on Nov 30, 2025 from 02:00–04:00 AM.',                          time: '10 days ago', action: null, tab: 'System Alerts' },
    { id: 18, unread: false, icon: <HiOutlineUser size={16} className="text-green-600" />,         iconBg: 'bg-green-100',  title: 'New Driver Approved: David Brooks',                   body: 'A new driver has been approved and is now available for job assignments.',                             time: '11 days ago', action: null, tab: 'System Alerts' },
    { id: 19, unread: false, icon: <HiOutlineDocumentText size={16} className="text-orange-600" />,iconBg: 'bg-orange-100', title: 'Counter-Offer Received for Job #J-10430',             body: 'A driver has submitted a counter-offer for a pending job.',                                            time: '11 days ago', action: { label: 'Review Offer' }, tab: 'Job Updates' },
    { id: 20, unread: false, icon: <HiOutlineCalendar size={16} className="text-red-600" />,       iconBg: 'bg-red-100',    title: 'Job Cancelled: #J-10310',                             body: 'The job for Bayshore Middle School has been cancelled by the client.',                                time: '12 days ago', action: null, tab: 'Job Updates'   },
    { id: 21, unread: false, icon: <HiOutlineCalendar size={16} className="text-blue-600" />,      iconBg: 'bg-blue-100',   title: 'New Job Assigned: #J-10550 for Maplewood High',       body: 'A new job has been created and assigned to driver Nina Ross.',                                         time: '13 days ago', action: null, tab: 'Job Updates'   },
    { id: 22, unread: false, icon: <HiOutlineExclamation size={16} className="text-yellow-600" />, iconBg: 'bg-yellow-100', title: 'Action Required: License Renewal',                    body: 'Driver Floyd Miles needs to renew their license within 20 days.',                                      time: '13 days ago', action: null, tab: 'System Alerts' },
    { id: 23, unread: false, icon: <HiOutlineUser size={16} className="text-green-600" />,         iconBg: 'bg-green-100',  title: 'New Driver Approved: Chloe Bennett',                  body: 'A new driver has been approved and is now available for job assignments.',                             time: '14 days ago', action: null, tab: 'System Alerts' },
];

const TABS = ['All', 'Unread', 'Job Updates', 'System Alerts', 'Day-off Requests'];
const ITEMS_PER_PAGE = 5;

/* ─── Component ──────────────────────────────────────────── */
const SubAdmin_Notifications = () => {
    const [activeTab, setActiveTab]       = useState('All');
    const [notifications, setNotifications] = useState(allNotifications);
    const [currentPage, setCurrentPage]   = useState(1);

    const filtered = notifications.filter((n) => {
        if (activeTab === 'All')            return true;
        if (activeTab === 'Unread')         return n.unread;
        if (activeTab === 'Day-off Requests') return false;
        return n.tab === activeTab;
    });

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const markAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    };

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 3) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 2) pages.push('...');
            if (currentPage > 1 && currentPage < totalPages) pages.push(currentPage);
            if (currentPage < totalPages - 1) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="space-y-5">

            {/* Page Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-[22px] font-bold text-gray-900">Notifications Center</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manage and view all your recent updates and alerts.</p>
                </div>
                <button
                    onClick={markAllRead}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    <MdCheckCircleOutline size={16} className="text-gray-500" />
                    Mark All as Read
                </button>
            </div>

            {/* Notifications Card */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">

                {/* Tabs Header */}
                <div className="px-5 pt-5 pb-0 border-b border-gray-100">
                    <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[15px] font-bold text-gray-900 mr-3">Recent Notifications</span>
                        {TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
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

                {/* Notification Items */}
                <div className="divide-y divide-gray-50">
                    {paginated.length > 0 ? paginated.map((notif) => (
                        <div key={notif.id} className={`flex items-start gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors ${notif.unread ? 'bg-blue-50/20' : ''}`}>
                            {/* Unread dot */}
                            <div className="w-2 mt-2 shrink-0 flex justify-center">
                                {notif.unread && (
                                    <span className="w-2 h-2 rounded-full bg-blue-500 block" />
                                )}
                            </div>

                            {/* Icon */}
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${notif.iconBg}`}>
                                {notif.icon}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 leading-snug">{notif.title}</p>
                                <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{notif.body}</p>
                                {notif.action && (
                                    <button className="mt-1.5 text-sm font-semibold text-[#005C7A] hover:underline">
                                        {notif.action.label}
                                    </button>
                                )}
                            </div>

                            {/* Time */}
                            <span className="text-xs text-gray-400 whitespace-nowrap mt-1 shrink-0">{notif.time}</span>
                        </div>
                    )) : (
                        <div className="py-16 text-center text-gray-400 text-sm">
                            No notifications found.
                        </div>
                    )}
                </div>

                {/* Footer / Pagination */}
                <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-500">
                        Showing <span className="font-medium text-gray-900">{filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                        <span className="font-medium text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</span> of{' '}
                        <span className="font-medium text-gray-900">{filtered.length}</span> results
                    </span>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <MdChevronLeft size={18} />
                        </button>

                        {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors border
                                    ${currentPage === page
                                        ? 'bg-[#005C7A] text-white border-[#005C7A] shadow-sm'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || totalPages === 0}
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
