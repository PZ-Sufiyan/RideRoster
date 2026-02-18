import React, { useState } from 'react';
import Breadcrumbs from '../../components/Breadcrumbs';
import {
    MdOutlineZoomIn,
    MdOutlineZoomOut,
    MdFileDownload,
    MdCheckCircle,
    MdOutlineCancel,
    MdCheck
} from 'react-icons/md';

const CompanyReview = () => {
    // Dummy Data
    const companyInfo = {
        name: "Bright Horizons Transport",
        contact: "Cody Fisher",
        email: "cody.fisher@bhtransport.com",
        phone: "(415) 555-0199",
        address: "123 Market St, San Francisco, CA 94103"
    };

    const documents = [
        { id: 1, name: "Business License", content: "Business License Document Content" },
        { id: 2, name: "Insurance Certificate", content: "Insurance Certificate Document Content" },
        { id: 3, name: "Vehicle Registrations", content: "Vehicle Registrations Document Content" },
        { id: 4, name: "Safety Compliance Form", content: "Safety Compliance Document Content" },
        { id: 5, name: "Tax ID Form (W-9)", content: "Tax ID Document Content" }
    ];

    const verificationItems = [
        "Business License Verified",
        "Insurance Policy Valid",
        "Vehicle Registrations Match",
        "Contact Info Confirmed"
    ];

    // State
    const [selectedDocId, setSelectedDocId] = useState(documents[0].id);
    const [note, setNote] = useState("");

    const selectedDoc = documents.find(doc => doc.id === selectedDocId);

    // Breadcrumb items
    const breadcrumbItems = [
        { label: 'Companies', to: '/companies' },
        { label: 'Pending Approvals', to: '/companies/pending' },
        { label: 'Bright Horizons Transport', isLast: true }
    ];

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState(null); // 'approve' or 'reject'

    const openModal = (action) => {
        setModalAction(action);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalAction(null);
    };

    const handleConfirmAction = () => {
        // Implement API call logic here
        console.log(`Company ${modalAction}d`);
        closeModal();
    };

    return (
        <div className="space-y-6 relative">
            {/* Breadcrumbs */}
            <Breadcrumbs items={breadcrumbItems} />

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Company Review</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Review and verify the submitted documents to approve or reject the company.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => openModal('reject')}
                        className="flex items-center gap-2 px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 transition-colors text-sm font-medium"
                    >
                        <MdOutlineCancel className="w-5 h-5" />
                        Reject Company
                    </button>
                    <button
                        onClick={() => openModal('approve')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-medium shadow-sm"
                    >
                        <MdCheckCircle className="w-5 h-5" />
                        Approve Company
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Submitted Documents */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[600px]">
                    <div className="p-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-800">Submitted Documents</h2>
                    </div>

                    <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                        {/* Document List (Tabs) */}
                        <div className="w-full md:w-64 border-r border-gray-100 bg-gray-50/50 flex-shrink-0 overflow-y-auto">
                            {documents.map((doc) => (
                                <button
                                    key={doc.id}
                                    onClick={() => setSelectedDocId(doc.id)}
                                    className={`w-full text-left px-4 py-4 text-sm font-medium transition-all duration-200 border-l-4 ${selectedDocId === doc.id
                                        ? 'bg-white border-blue-500 text-blue-600 shadow-sm'
                                        : 'border-transparent text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                                        }`}
                                >
                                    {doc.name}
                                </button>
                            ))}
                        </div>

                        {/* Document Preview Area */}
                        <div className="flex-1 bg-white p-6 relative flex flex-col items-center justify-center overflow-hidden">
                            {/* Controls in top-right of preview area */}
                            <div className="absolute top-4 right-4 flex items-center gap-2 bg-white shadow-sm border border-gray-100 rounded-lg p-1 z-10">
                                <button className="p-1.5 hover:bg-gray-50 rounded-md text-gray-500 hover:text-gray-700 transition-colors" title="Zoom In">
                                    <MdOutlineZoomIn className="w-5 h-5" />
                                </button>
                                <button className="p-1.5 hover:bg-gray-50 rounded-md text-gray-500 hover:text-gray-700 transition-colors" title="Zoom Out">
                                    <MdOutlineZoomOut className="w-5 h-5" />
                                </button>
                                <button className="p-1.5 hover:bg-gray-50 rounded-md text-gray-500 hover:text-gray-700 transition-colors" title="Download">
                                    <MdFileDownload className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content Placeholder */}
                            <div className="w-full h-full border border-gray-100 rounded bg-gray-50 flex flex-col items-center justify-center p-8 text-center relative">
                                {/* Using a generic placeholder illustration or text */}
                                <div className="opacity-50 mb-4">
                                    <svg className="w-24 h-24 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedDoc?.name}</h3>
                                <p className="text-sm text-gray-500 max-w-sm">
                                    This is a placeholder preview for the {selectedDoc?.name}.
                                    In a real application, the PDF or image would be rendered here.
                                </p>

                                {/* Mock content text block for visual richness */}
                                <div className="mt-8 text-xs text-gray-300 w-3/4 space-y-2 select-none blur-[1px]">
                                    <div className="h-2 bg-gray-200 rounded w-full"></div>
                                    <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                                    <div className="h-2 bg-gray-200 rounded w-full"></div>
                                    <div className="h-2 bg-gray-200 rounded w-4/6"></div>
                                    <div className="h-2 bg-gray-200 rounded w-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Info & Verification */}
                <div className="space-y-6">

                    {/* Company Details Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Company Details</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Company Name</label>
                                <p className="text-sm text-gray-900 font-medium">{companyInfo.name}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Primary Contact</label>
                                <p className="text-sm text-gray-900 font-medium">{companyInfo.contact}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Email Address</label>
                                <p className="text-sm text-blue-600 font-medium hover:underline cursor-pointer">{companyInfo.email}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Phone Number</label>
                                <p className="text-sm text-gray-900 font-medium">{companyInfo.phone}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Address</label>
                                <p className="text-sm text-gray-900 font-medium">{companyInfo.address}</p>
                            </div>
                        </div>
                    </div>

                    {/* Verification Checklist Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Verification Checklist</h2>
                        <ul className="space-y-3">
                            {verificationItems.map((item, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <div className="mt-0.5 min-w-[16px] w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-transparent"></div>
                                    </div>
                                    <span className="text-sm text-gray-700">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Internal Notes Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Internal Notes</h2>
                        <div className="space-y-4">
                            <textarea
                                className="w-full h-24 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50"
                                placeholder="Add verification notes here..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            ></textarea>
                            <button
                                className="w-full py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
                            >
                                Save Note
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Confirmation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 transform transition-all scale-100">
                        <div className="flex flex-col items-center text-center">
                            {modalAction === 'approve' ? (
                                <MdCheck className="w-12 h-12 text-green-500 mb-4 bg-green-100 rounded-full p-2" />
                            ) : (
                                <MdOutlineCancel className="w-12 h-12 text-red-500 mb-4 bg-red-100 rounded-full p-2" />
                            )}

                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                {modalAction === 'approve' ? 'Approve Company' : 'Reject Company'}
                            </h3>

                            <p className="text-sm text-gray-500 mb-6">
                                Are you sure you want to {modalAction} <span className="font-bold text-gray-900">{companyInfo.name}</span>?
                                {modalAction === 'approve'
                                    ? ' They will be notified and granted access.'
                                    : ' They will be notified about the rejection.'}
                            </p>

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmAction}
                                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors shadow-sm ${modalAction === 'approve'
                                            ? 'bg-green-500 hover:bg-green-600'
                                            : 'bg-red-500 hover:bg-red-600'
                                        }`}
                                >
                                    Yes, {modalAction === 'approve' ? 'Approve' : 'Reject'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyReview;
