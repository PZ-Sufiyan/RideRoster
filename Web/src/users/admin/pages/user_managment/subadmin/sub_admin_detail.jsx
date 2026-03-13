import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    MdArrowBack,
    MdEmail,
    MdPhone,
    MdCalendarToday,
    MdWork,
    MdPeopleAlt,
    MdAccessTime,
    MdAssignment,
    MdPersonAdd,
    MdBarChart,
    MdNotifications,
    MdAdd,
    MdUpdate
} from 'react-icons/md';

const PermissionItem = ({ icon: Icon, title, description, enabled, onToggle }) => (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl mb-3 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${enabled ? 'bg-blue-50 text-[#004D6D]' : 'bg-gray-50 text-gray-400'}`}>
                <Icon size={20} />
            </div>
            <div>
                <h4 className="text-[14px] font-bold text-gray-900">{title}</h4>
                <p className="text-[12px] text-gray-400 mt-0.5">{description}</p>
            </div>
        </div>
        <button
            onClick={onToggle}
            className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${enabled ? 'bg-[#004D6D]' : 'bg-gray-200'}`}
        >
            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    </div>
);

const ActivityItem = ({ icon: Icon, title, time, detail, isNew }) => (
    <div className="flex items-start gap-3 py-4 border-b border-gray-50 last:border-0 group cursor-pointer hover:bg-gray-50/50 -mx-2 px-2 rounded-lg transition-colors">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isNew ? 'bg-blue-50 text-[#004D6D]' : 'bg-gray-50 text-gray-400'} group-hover:scale-110 transition-transform`}>
            <Icon size={16} />
        </div>
        <div className="flex-1">
            <div className="flex justify-between">
                <p className="text-[13px] text-gray-600">
                    {title}
                </p>
                <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-4">{time}</span>
            </div>
            {detail && <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{detail}</p>}
        </div>
    </div>
);

const SubAdminDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [permissions, setPermissions] = useState([
        { id: 1, icon: MdAssignment, title: 'Assign Jobs', description: 'Create, edit, and assign jobs to available drivers.', enabled: true },
        { id: 2, icon: MdPersonAdd, title: 'Register Drivers', description: 'Add new drivers, upload documents, and manage profiles.', enabled: true },
        { id: 3, icon: MdBarChart, title: 'View Company Stats', description: 'Access high-level financial and operational reports.', enabled: false },
        { id: 4, icon: MdNotifications, title: 'Access Notifications', description: 'Send and manage broadcast messages to drivers.', enabled: true },
    ]);

    const togglePermission = (permId) => {
        setPermissions(perms => perms.map(p => p.id === permId ? { ...p, enabled: !p.enabled } : p));
    };

    const activeCount = permissions.filter(p => p.enabled).length;

    return (
        <div className="pb-24 mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header / Back Link */}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* ── LEFT SIDEBAR (1/3) ── */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Profile Header Card */}
                    <div className="flex flex-col items-center text-center p-6">
                        <div className="relative mb-4">
                            <img
                                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&h=256"
                                alt="Cameron Williamson"
                                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                            />
                            <div className="absolute bottom-1 right-2 w-5 h-5 bg-green-500 border-4 border-white rounded-full shadow-sm"></div>
                        </div>
                        <h2 className="text-[20px] font-bold text-gray-900 uppercase">Cameron Williamson</h2>
                        <span className="mt-2 px-3 py-1 bg-blue-50 text-[#004D6D] text-[11px] font-bold rounded-full uppercase tracking-wider">Sub-Admin</span>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-6 px-4">
                        <div className="flex items-start gap-3">
                            <MdEmail className="text-gray-400 mt-1" size={18} />
                            <div>
                                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-1">Email Address</p>
                                <p className="text-[14px] font-medium text-gray-800">sarah.j@rideroster.com</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <MdPhone className="text-gray-400 mt-1" size={18} />
                            <div>
                                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-1">Phone Number</p>
                                <p className="text-[14px] font-medium text-gray-800">+1 (555) 123-4567</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <MdCalendarToday className="text-gray-400 mt-1" size={18} />
                            <div>
                                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-1">Date Added</p>
                                <p className="text-[14px] font-medium text-gray-800">Oct 12, 2023</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-8 px-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Jobs Assigned</p>
                                <MdWork className="text-gray-300" size={14} />
                            </div>
                            <p className="text-[28px] font-bold text-gray-900">142</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Drivers Reg</p>
                                <MdPeopleAlt className="text-gray-300" size={14} />
                            </div>
                            <p className="text-[28px] font-bold text-gray-900">28</p>
                        </div>
                    </div>

                    {/* Last Active */}
                    <div className="flex items-center gap-3 pt-6 px-4">
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                            <MdAccessTime className="text-gray-400" size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Last Active</p>
                            <p className="text-[13px] font-bold text-gray-800">Today, 09:42 AM</p>
                        </div>
                    </div>
                </div>

                {/* ── MAIN CONTENT (2/3) ── */}
                <div className="lg:col-span-8 space-y-12">

                    {/* Permissions Section */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[16px] font-bold text-gray-900">Access Permissions</h3>
                            <span className="text-[11px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">
                                {activeCount} Active
                            </span>
                        </div>
                        <p className="text-[13px] text-gray-400 mb-6">Toggle specific capabilities for this sub-admin. Changes take effect immediately.</p>

                        <div className="space-y-2">
                            {permissions.map((perm) => (
                                <PermissionItem
                                    key={perm.id}
                                    icon={perm.icon}
                                    title={perm.title}
                                    description={perm.description}
                                    enabled={perm.enabled}
                                    onToggle={() => togglePermission(perm.id)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Activity Section */}
                    <div>
                        <h3 className="text-[16px] font-bold text-gray-900 mb-6 tracking-tight">Recent Activity</h3>
                        <div className="space-y-1">
                            <ActivityItem
                                icon={MdAdd}
                                title={<>Assigned a job to driver <span className="font-bold text-[#004D6D] border-b border-transparent hover:border-[#004D6D]">Michael Chen</span></>}
                                time="10 mins ago"
                                detail="Job ID: #JR-4920"
                                isNew={true}
                            />
                            <ActivityItem
                                icon={MdPeopleAlt}
                                title={<span className="font-bold text-gray-800">Added a driver profile</span>}
                                time="2 hours ago"
                                detail="Driver: David Rodriguez"
                                isNew={true}
                            />
                            <ActivityItem
                                icon={MdUpdate}
                                title={<span className="font-bold text-gray-800">Updated job schedule for tomorrow</span>}
                                time="Yesterday, 14:30"
                                detail="Job ID: #JR-4915"
                            />
                            <ActivityItem
                                icon={MdAdd}
                                title={<>Assigned a job to driver <span className="font-bold text-gray-800">Sarah Williams</span></>}
                                time="Oct 24, 09:15"
                                detail="Job ID: #JR-4902"
                            />
                        </div>
                        <button className="w-full text-center py-4 text-[13px] font-bold text-[#004D6D] hover:underline mt-4">
                            View All Activity
                        </button>
                    </div>
                </div>

            </div>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-100 px-8 py-4 flex justify-end gap-3 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                <button
                    onClick={() => navigate('/admin/users/subadmins')}
                    className="px-6 py-2.5 bg-white border border-gray-200 text-gray-500 rounded-lg text-[13px] font-bold hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button className="px-6 py-2.5 bg-[#004D6D] text-white rounded-lg text-[13px] font-bold hover:bg-[#003c55] transition-all shadow-md active:scale-[0.98]">
                    Save Changes
                </button>
            </div>
        </div>
    );
};

export default SubAdminDetail;
