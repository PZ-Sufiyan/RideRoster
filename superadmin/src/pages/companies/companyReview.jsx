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

// PDF Imports
import businessLicensePdf from '../../assets/dummypdf/Business_License.pdf';
import insuranceCertificatePdf from '../../assets/dummypdf/Insurance_Certificate.pdf';
import vehicleRegistrationsPdf from '../../assets/dummypdf/Vehicle_Registrations.pdf';
import safetyCompliancePdf from '../../assets/dummypdf/Safety_Compliance_Form.pdf';
import taxIdPdf from '../../assets/dummypdf/Tax_ID_Form_W9.pdf';

const CompanyReview = () => {
    // Company Info Dummy Data
    const companyInfo = {
        name: "Bright Horizons Transport",
        contact: "Cody Fisher",
        email: "cody.fisher@bhtransport.com",
        phone: "(415) 555-0199",
        address: "123 Market St, San Francisco, CA 94103"
    };

    // Document Mapping with unique PDF files
    const documents = [
        { id: 1, name: "Business License", file: businessLicensePdf },
        { id: 2, name: "Insurance Certificate", file: insuranceCertificatePdf },
        { id: 3, name: "Vehicle Registrations", file: vehicleRegistrationsPdf },
        { id: 4, name: "Safety Compliance Form", file: safetyCompliancePdf },
        { id: 5, name: "Tax ID Form (W-9)", file: taxIdPdf }
    ];

    const [verificationItems, setVerificationItems] = useState([
        { id: 1, text: "Business License Verified", checked: false },
        { id: 2, text: "Insurance Policy Valid", checked: false },
        { id: 3, text: "Vehicle Registrations Match", checked: false },
        { id: 4, text: "Contact Info Confirmed", checked: false }
    ]);

    // State
    const [selectedDocId, setSelectedDocId] = useState(documents[0].id);
    const [note, setNote] = useState("");
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [zoom, setZoom] = useState(1);

    const selectedDoc = documents.find(doc => doc.id === selectedDocId);

    // Document Handlers
    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
    const handleDownload = () => {
        if (!selectedDoc) return;
        const link = document.createElement('a');
        link.href = selectedDoc.file;
        link.download = `${selectedDoc.name.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toggleChecklistItem = (id) => {
        setVerificationItems(prev => prev.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        ));
    };

    const handleSaveNote = () => {
        if (!note.trim()) return;
        setIsSavingNote(true);
        // Simulate a save delay
        setTimeout(() => {
            setIsSavingNote(false);
            console.log("Note saved:", note);
        }, 800);
    };

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
                        className="flex items-center gap-2 px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 transition-colors text-sm font-medium active:scale-95"
                    >
                        <MdOutlineCancel className="w-5 h-5" />
                        Reject Company
                    </button>
                    <button
                        onClick={() => openModal('approve')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-medium shadow-sm active:scale-95"
                    >
                        <MdCheckCircle className="w-5 h-5" />
                        Approve Company
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Submitted Documents */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[700px]">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-800">Submitted Documents</h2>
                        <div className="text-xs text-gray-400 font-medium whitespace-nowrap">Viewing: {selectedDoc?.name}</div>
                    </div>

                    <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                        {/* Document List (Tabs) */}
                        <div className="w-full md:w-64 border-r border-gray-100 bg-gray-50/50 shrink-0 overflow-y-auto">
                            {documents.map((doc) => (
                                <button
                                    key={doc.id}
                                    onClick={() => {
                                        setSelectedDocId(doc.id);
                                        setZoom(1); // Reset zoom on doc change
                                    }}
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
                        <div className="flex-1 bg-[#F5F7F9] relative flex flex-col overflow-hidden">
                            {/* Controls Panel */}
                            <div className="absolute top-4 right-6 flex items-center gap-3 bg-white/95 backdrop-blur shadow-md border border-gray-200 rounded-xl px-3 py-2 z-20">
                                <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
                                    <button
                                        onClick={handleZoomOut}
                                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                                        title="Zoom Out"
                                    >
                                        <MdOutlineZoomOut className="w-5 h-5" />
                                    </button>
                                    <span className="text-[10px] font-bold text-gray-400 w-10 text-center">
                                        {Math.round(zoom * 100)}%
                                    </span>
                                    <button
                                        onClick={handleZoomIn}
                                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                                        title="Zoom In"
                                    >
                                        <MdOutlineZoomIn className="w-5 h-5" />
                                    </button>
                                </div>
                                <button
                                    onClick={handleDownload}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-green-600 transition-colors"
                                    title="Download Document"
                                >
                                    <MdFileDownload className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Scrollable PDF Container */}
                            <div className="flex-1 overflow-auto p-8 flex justify-center items-start scrollbar-hide">
                                <div
                                    className="bg-white shadow-2xl transition-transform duration-300 ease-out origin-top"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        transform: `scale(${zoom})`,
                                    }}
                                >
                                    <iframe
                                        key={selectedDoc?.id}
                                        src={`${selectedDoc?.file}#toolbar=0&navpanes=0`}
                                        className="w-full h-full border-none min-h-[500px]"
                                        title="Document Preview"
                                    />
                                </div>
                            </div>

                            {/* Document Info Footer */}
                            <div className="bg-white/80 backdrop-blur-sm border-t border-gray-100 px-6 py-3 flex items-center justify-between z-10">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
                                        <MdCheck size={14} />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-600">Verified Secure Document</span>
                                </div>
                                <span className="text-[10px] uppercase tracking-widest font-bold text-gray-300">RideRoster Secure Viewer</span>
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
                            {verificationItems.map((item) => (
                                <li
                                    key={item.id}
                                    onClick={() => toggleChecklistItem(item.id)}
                                    className="flex items-start gap-4 group cursor-pointer"
                                >
                                    <div className={`mt-0.5 min-w-[20px] w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${item.checked
                                            ? 'bg-blue-500 border-blue-500 text-white'
                                            : 'bg-white border-gray-300 group-hover:border-blue-400'
                                        }`}>
                                        {item.checked && <MdCheck className="w-4 h-4" />}
                                    </div>
                                    <span className={`text-sm transition-colors ${item.checked ? 'text-gray-900 font-medium' : 'text-gray-600 group-hover:text-gray-900'}`}>
                                        {item.text}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Internal Notes Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 font-sans">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Internal Notes</h2>
                        <div className="space-y-4">
                            <textarea
                                className="w-full h-24 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50 transition-all placeholder:text-gray-400"
                                placeholder="Add verification notes here..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            ></textarea>
                            <button
                                onClick={handleSaveNote}
                                disabled={isSavingNote || !note.trim()}
                                className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${isSavingNote
                                        ? 'bg-blue-100 text-blue-400 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 active:translate-y-px shadow-sm disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none'
                                    }`}
                            >
                                {isSavingNote ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                        Saving...
                                    </>
                                ) : 'Save Note'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 transform transition-all scale-100 font-sans">
                        <div className="flex flex-col items-center text-center">
                            {modalAction === 'approve' ? (
                                <MdCheck className="w-12 h-12 text-green-500 mb-4 bg-green-100 rounded-full p-2" />
                            ) : (
                                <MdOutlineCancel className="w-12 h-12 text-red-500 mb-4 bg-red-100 rounded-full p-2" />
                            )}
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                {modalAction === 'approve' ? 'Approve Company' : 'Reject Company'}
                            </h3>
                            <p className="text-sm text-gray-500 mb-6 px-2">
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
                                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors shadow-sm ${modalAction === 'approve' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
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
