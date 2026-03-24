import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack, MdEmail, MdPhone, MdLocationOn } from 'react-icons/md';
import { HiOutlineDocument } from 'react-icons/hi';

const driver = {
    name: 'Jacob Jones',
    driverId: 'DRV-84321',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=128&h=128',
    // Basic Info
    fullName: 'Jacob Jones',
    dateOfBirth: '1985-05-22',
    hireDate: '2022-08-01',
    assignedCompany: 'Bright Horizons Transport',
    // Contact
    email: 'jacob.jones@example.com',
    phone: '(219) 555-0114',
    address: '2972 Westheimer Rd. Santa Ana, Illinois 85486',
    // Vehicle & License
    licenseNo: 'D123-456-7890',
    licenseExpiry: '2028-05-22',
    assignedVehicle: 'Ford Transit 2023',
    licensePlate: 'CALI-456',
    // Documents
    documents: [
        { name: 'drivers_license.pdf' },
        { name: 'background_check.pdf' },
        { name: 'vehicle_registration.pdf' },
    ],
};

const SubAdmin_DriverProfile = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-5">

            {/* Page Title */}
            <div>
                <h1 className="text-[22px] font-bold text-gray-900">Driver Profile</h1>
                <p className="text-sm text-gray-500 mt-0.5">View-only access for driver information and documents.</p>
            </div>

            {/* Top Row: Profile Card (left) + Basic Info (right) */}
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">

                {/* Profile Card */}
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 flex flex-col items-center text-center">
                    <img
                        src={driver.avatar}
                        alt={driver.name}
                        className="w-16 h-16 rounded-full object-cover border border-gray-200 mb-3"
                    />
                    <h2 className="text-lg font-bold text-gray-900">{driver.name}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Driver ID: {driver.driverId}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                        {driver.status}
                    </span>
                </div>

                {/* Basic Information */}
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
                    <h3 className="text-[15px] font-bold text-gray-900 mb-5">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                        <div>
                            <p className="text-xs text-gray-400 mb-1">Full Name</p>
                            <p className="text-sm font-semibold text-gray-900">{driver.fullName}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-1">Date of Birth</p>
                            <p className="text-sm font-semibold text-gray-900">{driver.dateOfBirth}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-1">Hire Date</p>
                            <p className="text-sm font-semibold text-gray-900">{driver.hireDate}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-1">Assigned Company</p>
                            <p className="text-sm font-semibold text-gray-900">{driver.assignedCompany}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Contact Info (left) + Vehicle & License + Documents (right) */}
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">

                {/* Contact Information */}
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
                    <h3 className="text-[15px] font-bold text-gray-900 mb-5">Contact Information</h3>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                                <MdEmail size={16} className="text-gray-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Email Address</p>
                                <p className="text-sm font-medium text-gray-800 break-all">{driver.email}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                                <MdPhone size={16} className="text-gray-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Phone Number</p>
                                <p className="text-sm font-medium text-gray-800">{driver.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                                <MdLocationOn size={16} className="text-gray-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Address</p>
                                <p className="text-sm font-medium text-gray-800">{driver.address}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Vehicle/License + Documents stacked */}
                <div className="space-y-5">

                    {/* Vehicle & License Details */}
                    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
                        <h3 className="text-[15px] font-bold text-gray-900 mb-5">Vehicle &amp; License Details</h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Driver's License No.</p>
                                <p className="text-sm font-semibold text-gray-900">{driver.licenseNo}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-1">License Expiry Date</p>
                                <p className="text-sm font-semibold text-gray-900">{driver.licenseExpiry}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Assigned Vehicle</p>
                                <p className="text-sm font-semibold text-gray-900">{driver.assignedVehicle}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-1">License Plate</p>
                                <p className="text-sm font-semibold text-gray-900">{driver.licensePlate}</p>
                            </div>
                        </div>
                    </div>

                    {/* Uploaded Documents */}
                    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
                        <h3 className="text-[15px] font-bold text-gray-900 mb-4">Uploaded Documents</h3>
                        <div className="space-y-3">
                            {driver.documents.map((doc) => (
                                <div
                                    key={doc.name}
                                    className="flex items-center justify-between px-4 py-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {/* PDF icon */}
                                        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                                            <HiOutlineDocument size={16} className="text-red-500" />
                                        </div>
                                        <span className="text-sm text-gray-700 font-medium">{doc.name}</span>
                                    </div>
                                    <button className="text-[13px] font-semibold text-[#005C7A] hover:underline">
                                        View
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
};

export default SubAdmin_DriverProfile;
