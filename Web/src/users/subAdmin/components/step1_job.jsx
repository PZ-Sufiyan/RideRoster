import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdKeyboardArrowDown, MdAdd, MdRemove, MdGpsFixed, MdTrendingFlat } from 'react-icons/md';
import { loadJobDraft, saveJobDraft } from '../../../services/jobService';

const Step1Job = ({ setToasts }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState(() => {
        const d = loadJobDraft();
        const s1 = d.step1 || {};
        return {
            city: s1.city ?? '',
            jobName: s1.job_name ?? '',
            jobType: s1.job_type || 'School Contract',
            clientName: s1.client_school_name ?? '',
            internalId: s1.internal_job_id ?? '',
        };
    });
    const [submitAttempted, setSubmitAttempted] = useState(false);

    useEffect(() => {
        saveJobDraft({
            step1: {
                city: formData.city,
                job_name: formData.jobName,
                job_type: formData.jobType,
                client_school_name: formData.clientName,
                internal_job_id: formData.internalId,
            },
        });
    }, [formData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleNext = () => {
        setSubmitAttempted(true);
        if (!formData.jobName.trim() || !formData.clientName.trim() || !formData.jobType.trim()) {
            setToasts((prev) => [
                ...prev,
                {
                    id: `${Date.now()}-${Math.random()}`,
                    type: 'warning',
                    message: 'Please fill in all required fields before moving to next step.',
                    autoClose: true,
                    duration: 3500,
                },
            ]);
            return;
        }
        saveJobDraft({
            step1: {
                city: formData.city.trim(),
                job_name: formData.jobName.trim(),
                job_type: formData.jobType.trim(),
                client_school_name: formData.clientName.trim(),
                internal_job_id: formData.internalId.trim(),
            },
        });
        navigate('/subadmin/jobs/add-job?step=2');
    };

    const fieldClass = (invalid) =>
        `w-full px-4 py-3 bg-[#F9FAFB] border rounded-xl text-[14px] placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
            invalid
                ? 'border-red-400 text-red-700 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-200 text-gray-900 focus:ring-[#004D6D]/20 focus:border-[#004D6D]'
        }`;

    return (
        <>
            <div className="flex items-center gap-4 mb-8">
                <div>
                    <h1 className="text-[22px] font-bold text-gray-900 leading-tight">Step 1 of 3: Route Information</h1>
                    <p className="text-[13px] text-gray-500 mt-1">
                        Details are saved in this browser session until you finish step 3 (nothing is written to the database yet).
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 h-full">
                    <div className="mb-8">
                        <h2 className="text-[18px] font-bold text-gray-900">Route Details</h2>
                        <p className="text-[14px] text-gray-500 mt-1">Start by defining the basic information for this job.</p>
                    </div>
                    <div className="space-y-2">
    <label className="text-[13px] font-bold text-gray-700">City</label>
    <input
        type="text"
        name="city"
        value={formData.city}
        onChange={handleChange}
        placeholder="e.g., Manchester"
        className="w-full px-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/20 focus:border-[#004D6D] transition-all"
    />
</div>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-gray-700">
                                Job Name / Route Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="jobName"
                                value={formData.jobName}
                                onChange={handleChange}
                                placeholder="e.g., Morning School Run - Route A"
                                className={fieldClass(submitAttempted && !formData.jobName.trim())}
                            />
                            {submitAttempted && !formData.jobName.trim() && (
                                <p className="text-[12px] font-semibold text-red-600">Job Name / Route Title is required.</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-gray-700">
                                Job Type <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    name="jobType"
                                    value={formData.jobType}
                                    onChange={handleChange}
                                    className={fieldClass(submitAttempted && !formData.jobType.trim()) + ' appearance-none cursor-pointer'}
                                >
                                    <option>School Contract</option>
                                    <option>College Contract</option>
                                    <option>Centre Contract</option>
                                    <option>Ad Hoc Contract</option>
                                    <option>All Year Round Contract</option>
                                </select>
                                <MdKeyboardArrowDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                            </div>
                            {submitAttempted && !formData.jobType.trim() && (
                                <p className="text-[12px] font-semibold text-red-600">Job Type is required.</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-gray-700">
                                Client / School Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="clientName"
                                value={formData.clientName}
                                onChange={handleChange}
                                placeholder="e.g., Northwood High School"
                                className={fieldClass(submitAttempted && !formData.clientName.trim())}
                            />
                            {submitAttempted && !formData.clientName.trim() && (
                                <p className="text-[12px] font-semibold text-red-600">Client / School Name is required.</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-gray-700">Internal Job ID (Optional)</label>
                            <input
                                type="text"
                                name="internalId"
                                value={formData.internalId}
                                onChange={handleChange}
                                placeholder="e.g., NHS-MORN-001"
                                className="w-full px-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/20 focus:border-[#004D6D] transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Map Preview */}
                <div className="relative rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-[500px] lg:h-full min-h-[500px]">
                    <div
                        className="absolute inset-0 bg-[#E5E7EB]"
                        style={{
                            backgroundImage: `url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/0,0,1,0/1280x1280?access_token=pk.eyJ1IjoibGFicmFkb3I5OSIsImEiOiJjbGlxa3R3Y2UwMDNjM2RwYmFqbXZ3ZTh1In0.dGstfI9h-mRj-v_T6YjTaw')`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]">
                            {[
                                { top: '30%', left: '45%' }, { top: '35%', left: '48%' },
                                { top: '40%', left: '42%' }, { top: '45%', left: '55%' },
                                { top: '50%', left: '40%' }, { top: '55%', left: '50%' },
                                { top: '60%', left: '45%' }, { top: '38%', left: '52%' },
                                { top: '32%', left: '38%' }, { top: '42%', left: '40%' },
                                { top: '28%', left: '58%' }, { top: '52%', left: '62%' },
                                { top: '48%', left: '35%' },
                            ].map((pin, i) => (
                                <div key={i} className="absolute transform -translate-x-1/2 -translate-y-full" style={{ top: pin.top, left: pin.left }}>
                                    <div className="relative group cursor-pointer transition-transform hover:scale-110">
                                        <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                        </div>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-8 border-t-red-500" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="absolute right-4 bottom-4 flex flex-col gap-2">
                        <button type="button" className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 text-gray-600 transition-all active:scale-95"><MdAdd size={20} /></button>
                        <button type="button" className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 text-gray-600 transition-all active:scale-95"><MdGpsFixed size={20} /></button>
                        <button type="button" className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 text-gray-600 transition-all active:scale-95"><MdRemove size={20} /></button>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
                <button onClick={() => navigate('/subadmin/jobs')} className="text-[14px] font-bold text-gray-500 hover:text-gray-900 transition-colors">
                    Cancel
                </button>
                <button onClick={handleNext} className="flex items-center gap-2 px-8 py-2.5 bg-[#004D6D] text-white rounded-xl text-[14px] font-bold hover:bg-[#003c55] transition-all shadow-lg shadow-[#004D6D]/20 active:scale-95">
                    Next: Pickups & Drop-offs
                    <MdTrendingFlat size={20} />
                </button>
            </div>
        </>
    );
};

export default Step1Job;