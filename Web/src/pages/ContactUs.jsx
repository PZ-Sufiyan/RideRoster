import React from 'react';
import { Link } from 'react-router-dom';
import {
    HiOutlineMail,
    HiOutlineClock,
    HiOutlineOfficeBuilding,
    HiOutlineExclamationCircle,
    HiOutlineGlobeAlt,
} from 'react-icons/hi';
import PublicLayout from '../layouts/PublicLayout';

const ContactBlock = ({ icon: Icon, title, children }) => (
    <div className="py-6 first:pt-0 last:pb-0 border-b border-gray-100 last:border-b-0">
        <div className="flex items-start gap-3.5">
            <div className="mt-0.5 w-9 h-9 rounded-lg bg-[#004D6D]/10 text-[#004D6D] flex items-center justify-center shrink-0">
                <Icon size={18} />
            </div>
            <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-gray-900">{title}</h2>
                <div className="mt-1.5 text-[14px] text-gray-600 leading-relaxed">
                    {children}
                </div>
            </div>
        </div>
    </div>
);

const EmailLink = ({ email }) => (
    <a
        href={`mailto:${email}`}
        className="font-semibold text-[#004D6D] hover:underline break-all"
    >
        {email}
    </a>
);

const ContactUs = () => (
    <PublicLayout>
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] px-6 sm:px-10 py-8 sm:py-12">
                <header className="pb-8 border-b border-gray-100">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#004D6D]">
                        Support
                    </p>
                    <h1 className="mt-2 text-2xl sm:text-[28px] font-bold text-gray-900 tracking-tight">
                        Contact Us
                    </h1>
                    <p className="mt-2 text-[15px] text-gray-600">
                        NST / NST SCH Support
                    </p>
                    <p className="mt-4 text-[14px] text-gray-600 leading-relaxed max-w-xl">
                        We&apos;re here to help. Reach the right team using the contacts below —
                        we typically respond within one business day.
                    </p>
                </header>

                <div className="mt-2">
                    <ContactBlock icon={HiOutlineMail} title="General Inquiries &amp; Support">
                        <p>
                            Email: <EmailLink email="admin@nst-sch.com" />
                        </p>
                    </ContactBlock>

                    <ContactBlock icon={HiOutlineMail} title="Technical Support">
                        <p>
                            Email: <EmailLink email="dev@nst-sch.com" />
                        </p>
                    </ContactBlock>

                    <ContactBlock icon={HiOutlineMail} title="Privacy &amp; Data Requests">
                        <p>
                            Email: <EmailLink email="privacy@nst-sch.com" />
                        </p>
                        <p className="mt-2 text-[13px] text-gray-500">
                            For subject access requests and privacy queries. See our{' '}
                            <Link to="/privacy-policy" className="text-[#004D6D] font-medium hover:underline">
                                Privacy Policy
                            </Link>
                            .
                        </p>
                    </ContactBlock>

                    <ContactBlock icon={HiOutlineExclamationCircle} title="Emergency (SOS related issues only)">
                        <p>
                            Please use the SOS button inside the app for urgent incidents during
                            rides. Email support is not monitored for real-time emergencies.
                        </p>
                    </ContactBlock>

                    <ContactBlock icon={HiOutlineClock} title="Business Hours">
                        <p>Monday – Friday: 9:00 AM – 6:00 PM (UK Time)</p>
                        <p className="mt-1 text-[13px] text-gray-500">
                            Response time: within 24 business hours
                        </p>
                    </ContactBlock>

                    <ContactBlock icon={HiOutlineOfficeBuilding} title="Company Information">
                        <p className="font-semibold text-gray-800">
                            NOTTINGHAM SPECIALIST TRANSPORT LTD
                        </p>
                        <p className="mt-1.5">
                            C/O Sbe Accountants<br />
                            Quadrant Court, 49 Calthorpe Road, Edgbaston<br />
                            Birmingham B15 1TH<br />
                            United Kingdom (GB)
                        </p>
                    </ContactBlock>

                    <ContactBlock icon={HiOutlineGlobeAlt} title="Website">
                        <a
                            href="https://nst-sch.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-[#004D6D] hover:underline"
                        >
                            https://nst-sch.com/
                        </a>
                    </ContactBlock>
                </div>

                <p className="mt-8 pt-6 border-t border-gray-100 text-[13px] text-gray-500">
                    Thank you for using NST / NST SCH.
                </p>
            </div>
        </div>
    </PublicLayout>
);

export default ContactUs;
