import React from 'react';
import PublicLayout from '../layouts/PublicLayout';

const Section = ({ number, title, children }) => (
    <section className="pt-8 first:pt-0">
        <h2 className="text-[17px] font-semibold text-gray-900 tracking-tight">
            {number}. {title}
        </h2>
        <div className="mt-3 text-[14px] text-gray-600 leading-relaxed space-y-3">
            {children}
        </div>
    </section>
);

const Bullet = ({ children }) => (
    <li className="flex gap-2.5">
        <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-[#004D6D] shrink-0" />
        <span>{children}</span>
    </li>
);

const PrivacyPolicy = () => (
    <PublicLayout>
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] px-6 sm:px-10 py-8 sm:py-12">
                <header className="pb-8 border-b border-gray-100">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#004D6D]">
                        Legal
                    </p>
                    <h1 className="mt-2 text-2xl sm:text-[28px] font-bold text-gray-900 tracking-tight">
                        Privacy Policy
                    </h1>
                    <p className="mt-2 text-[13px] text-gray-500">
                        Last Updated: 17 July 2026
                    </p>
                    <p className="mt-5 text-[14px] text-gray-600 leading-relaxed max-w-2xl">
                        <span className="font-semibold text-gray-800">NST</span> (also referred to as
                        &quot;NST SCH&quot; on Android) is a SaaS platform developed by iTECH that helps
                        UK transport companies manage school and specialist passenger pick-up and
                        drop-off services.
                    </p>
                    <p className="mt-3 text-[14px] text-gray-600 leading-relaxed max-w-2xl">
                        This Privacy Policy explains how we collect, use, store, and protect your
                        personal information when you use our mobile apps (NST on iOS and NST SCH on
                        Android) and web portal.
                    </p>
                </header>

                <div className="mt-8 divide-y divide-gray-100">
                    <Section number="1" title="Information We Collect">
                        <p>We collect the following types of information:</p>
                        <ul className="space-y-2.5 mt-1">
                            <Bullet>
                                <span className="font-medium text-gray-800">Account Information:</span>{' '}
                                Name, email, phone number, password (hashed).
                            </Bullet>
                            <Bullet>
                                <span className="font-medium text-gray-800">Driver/PA Information:</span>{' '}
                                Driving licence details, DBS certificate, vehicle registration, and
                                uploaded documents.
                            </Bullet>
                            <Bullet>
                                <span className="font-medium text-gray-800">Location Data:</span>{' '}
                                GPS location during active rides (with explicit consent) for arrival
                                detection, navigation, and safety features.
                            </Bullet>
                            <Bullet>
                                <span className="font-medium text-gray-800">Job &amp; Usage Data:</span>{' '}
                                Pickup/drop-off addresses, job details, ride tracking data, and daily
                                updates.
                            </Bullet>
                            <Bullet>
                                <span className="font-medium text-gray-800">Device Information:</span>{' '}
                                Device type, OS version, and IP address (for security and analytics).
                            </Bullet>
                            <Bullet>
                                <span className="font-medium text-gray-800">Photos &amp; Documents:</span>{' '}
                                Documents uploaded for vehicle verification.
                            </Bullet>
                        </ul>
                    </Section>

                    <Section number="2" title="How We Use Your Information">
                        <ul className="space-y-2.5">
                            <Bullet>
                                To provide and operate the NST service (job assignment, ride tracking,
                                notifications).
                            </Bullet>
                            <Bullet>
                                For safety and compliance (vehicle checks, SOS alerts, audit trails).
                            </Bullet>
                            <Bullet>
                                To send important notifications (job alerts, approvals, emergencies).
                            </Bullet>
                            <Bullet>
                                To improve our service through analytics (anonymous usage data).
                            </Bullet>
                            <Bullet>
                                To respond to support requests and legal obligations.
                            </Bullet>
                        </ul>
                    </Section>

                    <Section number="3" title="Legal Basis (UK GDPR)">
                        <p>We process your data based on:</p>
                        <ul className="space-y-2.5 mt-1">
                            <Bullet>
                                <span className="font-medium text-gray-800">Contract</span> — to provide
                                the service
                            </Bullet>
                            <Bullet>
                                <span className="font-medium text-gray-800">Legitimate Interest</span> —
                                safety, service improvement
                            </Bullet>
                            <Bullet>
                                <span className="font-medium text-gray-800">Legal Obligation</span> —
                                compliance with UK transport &amp; safeguarding laws
                            </Bullet>
                            <Bullet>
                                <span className="font-medium text-gray-800">Consent</span> — for certain
                                location data
                            </Bullet>
                        </ul>
                    </Section>

                    <Section number="4" title="Data Sharing">
                        <p>
                            We do not sell your data. We may share data with:
                        </p>
                        <ul className="space-y-2.5 mt-1">
                            <Bullet>
                                Your company admin (within your tenant only).
                            </Bullet>
                            <Bullet>
                                Supabase (our self-hosted backend provider on UK/EU servers).
                            </Bullet>
                            <Bullet>
                                Emergency contacts (in case of SOS alert, only necessary details).
                            </Bullet>
                        </ul>
                        <p className="mt-3">
                            All data is isolated per company (multi-tenant architecture).
                        </p>
                    </Section>

                    <Section number="5" title="Data Storage &amp; Security">
                        <ul className="space-y-2.5">
                            <Bullet>
                                Data is stored on secure servers in the UK/EU.
                            </Bullet>
                            <Bullet>
                                We use encryption in transit and at rest.
                            </Bullet>
                            <Bullet>
                                Access is strictly role-based and logged.
                            </Bullet>
                        </ul>
                    </Section>

                    <Section number="6" title="Your Rights">
                        <p>You have the right to:</p>
                        <ul className="space-y-2.5 mt-1">
                            <Bullet>Access, correct, or delete your data</Bullet>
                            <Bullet>Withdraw consent</Bullet>
                            <Bullet>Object to processing</Bullet>
                            <Bullet>Request data portability</Bullet>
                        </ul>
                        <p className="mt-3">
                            To exercise these rights, contact us at:{' '}
                            <a
                                href="mailto:privacy@nst-sch.com"
                                className="font-semibold text-[#004D6D] hover:underline"
                            >
                                privacy@nst-sch.com
                            </a>
                        </p>
                    </Section>

                    <Section number="7" title="Data Retention">
                        <p>
                            We retain data only as long as necessary for the service or as required by
                            law (e.g., safety and audit records).
                        </p>
                    </Section>

                    <Section number="8" title="Children&apos;s Data">
                        <p>
                            Our service is used for school transport. We do not knowingly collect data
                            directly from children. Parents/guardians and transport companies are
                            responsible for appropriate consent.
                        </p>
                    </Section>

                    <Section number="9" title="Changes to this Policy">
                        <p>
                            We may update this policy occasionally. We will notify you of significant
                            changes via email or in-app notice.
                        </p>
                    </Section>
                </div>

                <aside className="mt-10 pt-8 border-t border-gray-100">
                    <h2 className="text-[15px] font-semibold text-gray-900">Data Controller</h2>
                    <div className="mt-3 text-[13px] text-gray-600 leading-relaxed">
                        <p className="font-semibold text-gray-800">
                            NOTTINGHAM SPECIALIST TRANSPORT LTD
                        </p>
                        <p className="mt-1">
                            C/O Sbe Accountants<br />
                            Quadrant Court, 49 Calthorpe Road, Edgbaston<br />
                            Birmingham B15 1TH<br />
                            United Kingdom (GB)
                        </p>
                        <p className="mt-3">
                            Email:{' '}
                            <a
                                href="mailto:privacy@nst-sch.com"
                                className="font-semibold text-[#004D6D] hover:underline"
                            >
                                privacy@nst-sch.com
                            </a>
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    </PublicLayout>
);

export default PrivacyPolicy;
