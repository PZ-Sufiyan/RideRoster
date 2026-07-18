import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';

const Step = ({ number, children }) => (
    <li className="flex gap-3">
        <span className="mt-0.5 w-6 h-6 rounded-full bg-[#004D6D] text-white text-[12px] font-bold flex items-center justify-center shrink-0">
            {number}
        </span>
        <span className="text-[14px] text-gray-600 leading-relaxed pt-0.5">{children}</span>
    </li>
);

const AccountDeletion = () => (
    <PublicLayout>
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] px-6 sm:px-10 py-8 sm:py-12">
                <header className="pb-8 border-b border-gray-100">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#004D6D]">
                        NST / NST SCH
                    </p>
                    <h1 className="mt-2 text-2xl sm:text-[28px] font-bold text-gray-900 tracking-tight">
                        Request Account Deletion
                    </h1>
                    <p className="mt-4 text-[14px] text-gray-600 leading-relaxed max-w-2xl">
                        This page explains how to request deletion of your NST (iOS) or NST SCH
                        (Android) account and the personal data associated with it, as required by
                        Google Play and applicable data protection law.
                    </p>
                </header>

                <section className="pt-8">
                    <h2 className="text-[17px] font-semibold text-gray-900">
                        How to request deletion
                    </h2>
                    <ol className="mt-4 space-y-3.5">
                        <Step number="1">
                            Send an email to{' '}
                            <a
                                href="mailto:privacy@nst-sch.com?subject=Account%20Deletion%20Request%20-%20NST%20%2F%20NST%20SCH"
                                className="font-semibold text-[#004D6D] hover:underline"
                            >
                                privacy@nst-sch.com
                            </a>
                            .
                        </Step>
                        <Step number="2">
                            Use the subject line:{' '}
                            <span className="font-medium text-gray-800">
                                Account Deletion Request – NST / NST SCH
                            </span>
                            .
                        </Step>
                        <Step number="3">
                            Include in the email: your full name, registered email address, phone
                            number (if used on the account), and your role (Driver, PA, Admin, or
                            Sub-Admin).
                        </Step>
                        <Step number="4">
                            We will verify your identity, then process the request and confirm by
                            email when deletion is complete.
                        </Step>
                    </ol>
                    <p className="mt-4 text-[13px] text-gray-500">
                        Typical response time: within 24 business hours. Deletion is usually
                        completed within 30 days of verification, unless a longer retention period
                        is required by law (see below).
                    </p>
                </section>

                <section className="pt-8 mt-2 border-t border-gray-100">
                    <h2 className="text-[17px] font-semibold text-gray-900">
                        Data that is deleted
                    </h2>
                    <p className="mt-3 text-[14px] text-gray-600 leading-relaxed">
                        When your account is deleted, we remove or anonymise personal data linked to
                        your account, including where applicable:
                    </p>
                    <ul className="mt-3 space-y-2 text-[14px] text-gray-600">
                        <li className="flex gap-2.5">
                            <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-[#004D6D] shrink-0" />
                            Account profile (name, email, phone, profile photo)
                        </li>
                        <li className="flex gap-2.5">
                            <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-[#004D6D] shrink-0" />
                            Uploaded documents and vehicle photos used for verification
                        </li>
                        <li className="flex gap-2.5">
                            <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-[#004D6D] shrink-0" />
                            Device tokens used for push notifications
                        </li>
                        <li className="flex gap-2.5">
                            <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-[#004D6D] shrink-0" />
                            App authentication credentials for your login
                        </li>
                    </ul>
                </section>

                <section className="pt-8 mt-2 border-t border-gray-100">
                    <h2 className="text-[17px] font-semibold text-gray-900">
                        Data that may be retained
                    </h2>
                    <p className="mt-3 text-[14px] text-gray-600 leading-relaxed">
                        Certain records may be kept for a limited period where required for legal,
                        safety, safeguarding, or audit obligations under UK transport and employment
                        law. This may include:
                    </p>
                    <ul className="mt-3 space-y-2 text-[14px] text-gray-600">
                        <li className="flex gap-2.5">
                            <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-[#004D6D] shrink-0" />
                            Job and ride history needed for company audit trails
                        </li>
                        <li className="flex gap-2.5">
                            <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-[#004D6D] shrink-0" />
                            SOS / safety incident records
                        </li>
                        <li className="flex gap-2.5">
                            <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-[#004D6D] shrink-0" />
                            Records your transport company is legally required to retain
                        </li>
                    </ul>
                    <p className="mt-3 text-[14px] text-gray-600 leading-relaxed">
                        Retained data is kept only as long as necessary for those purposes, then
                        deleted or anonymised. See our{' '}
                        <Link to="/privacy-policy" className="font-semibold text-[#004D6D] hover:underline">
                            Privacy Policy
                        </Link>{' '}
                        for full details.
                    </p>
                </section>

                <aside className="mt-10 pt-8 border-t border-gray-100 text-[13px] text-gray-600 leading-relaxed">
                    <p className="font-semibold text-gray-800">
                        NOTTINGHAM SPECIALIST TRANSPORT LTD
                    </p>
                    <p className="mt-1">
                        Privacy contact:{' '}
                        <a
                            href="mailto:privacy@nst-sch.com"
                            className="font-semibold text-[#004D6D] hover:underline"
                        >
                            privacy@nst-sch.com
                        </a>
                    </p>
                </aside>
            </div>
        </div>
    </PublicLayout>
);

export default AccountDeletion;
